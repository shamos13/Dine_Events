package com.dineevents.Payment.Service;

import com.dineevents.Payment.DTO.Mpesa.MpesaAuthResponse;
import com.dineevents.Payment.DTO.Mpesa.StkPushQueryRequest;
import com.dineevents.Payment.DTO.Mpesa.StkPushQueryResponse;
import com.dineevents.Payment.DTO.Mpesa.StkPushRequest;
import com.dineevents.Payment.DTO.Mpesa.StkPushResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class MpesaService {

    @Value("${app.mpesa.consumer-key:}")
    private String consumerKey;

    @Value("${app.mpesa.consumer-secret:}")
    private String consumerSecret;

    @Value("${app.mpesa.shortcode}")
    private String shortcode;

    @Value("${app.mpesa.passkey:}")
    private String passkey;

    @Value("${app.mpesa.callback-url}")
    private String callbackUrl;

    @Value("${app.mpesa.base-url}")
    private String baseUrl;

    @Value("${app.mpesa.transaction-type:CustomerPayBillOnline}")
    private String transactionType;

    @Value("${app.mpesa.enabled:false}")
    private boolean enabled;

    private static final Pattern JSON_STRING_FIELD =
            Pattern.compile("\"(errorCode|errorMessage|faultstring)\"\\s*:\\s*\"([^\"]+)\"");

    /** Leave a buffer before Safaricom's ~3600s expiry. */
    private static final long TOKEN_TTL_SECONDS = 3300;
    private static final String USER_AGENT =
            "DineEvents-SmartCaterer/1.0 (+https://localhost; M-Pesa Daraja client)";

    private final RestClient restClient = RestClient.builder()
            .defaultHeader(HttpHeaders.USER_AGENT, USER_AGENT)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .build();

    private final Object tokenLock = new Object();
    private volatile String cachedAccessToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    public boolean isEnabled() {
        return enabled;
    }

    private String getAccessToken() {
        Instant now = Instant.now();
        String cached = cachedAccessToken;
        if (cached != null && now.isBefore(tokenExpiresAt)) {
            return cached;
        }

        synchronized (tokenLock) {
            if (cachedAccessToken != null && Instant.now().isBefore(tokenExpiresAt)) {
                return cachedAccessToken;
            }

            if (consumerKey == null || consumerKey.isBlank()
                    || consumerSecret == null || consumerSecret.isBlank()) {
                throw new IllegalStateException(
                        "M-Pesa consumer key/secret are not configured on this server");
            }

            String credentials = Base64.getEncoder()
                    .encodeToString((consumerKey + ":" + consumerSecret).getBytes());

            try {
                MpesaAuthResponse response = restClient.get()
                        .uri(baseUrl + "/oauth/v1/generate?grant_type=client_credentials")
                        .header(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
                        .retrieve()
                        .body(MpesaAuthResponse.class);

                if (response == null || response.getAccessToken() == null) {
                    throw new IllegalStateException("Failed to obtain M-Pesa access token");
                }

                cachedAccessToken = response.getAccessToken();
                tokenExpiresAt = Instant.now().plusSeconds(TOKEN_TTL_SECONDS);
                log.info("Obtained M-Pesa access token (cached for {}s)", TOKEN_TTL_SECONDS);
                return cachedAccessToken;
            } catch (RestClientResponseException ex) {
                clearCachedToken();
                throw new IllegalStateException(
                        "Failed to obtain M-Pesa access token: "
                                + humanizeHttpError(ex.getStatusCode().value(), ex.getResponseBodyAsString(), ex.getMessage()));
            } catch (IllegalStateException ex) {
                clearCachedToken();
                throw ex;
            } catch (Exception ex) {
                clearCachedToken();
                throw new IllegalStateException("Failed to obtain M-Pesa access token: " + ex.getMessage());
            }
        }
    }

    public StkPushResponse initiateStkPush(String phoneNumber, BigDecimal amount, String accountReference) {
        if (!enabled) {
            throw new IllegalStateException("M-Pesa payments are not enabled on this server");
        }
        assertPublicCallbackUrl();

        String formattedPhone = normalizePhoneNumber(phoneNumber);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String password = Base64.getEncoder()
                .encodeToString((shortcode + passkey + timestamp).getBytes());

        StkPushRequest request = new StkPushRequest();
        request.setBusinessShortCode(shortcode);
        request.setPassword(password);
        request.setTimestamp(timestamp);
        request.setTransactionType(transactionType);
        request.setAmount(String.valueOf(amount.intValue()));
        request.setPartyA(formattedPhone);
        request.setPartyB(shortcode);
        request.setPhoneNumber(formattedPhone);
        request.setCallBackURL(callbackUrl);
        request.setAccountReference(accountReference);
        request.setTransactionDesc("DineEvents Payment");

        log.info("Initiating STK push for {} amount {} callback={}", formattedPhone, amount, callbackUrl);

        try {
            return restClient.post()
                    .uri(baseUrl + "/mpesa/stkpush/v1/processrequest")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getAccessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(StkPushResponse.class);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 401) {
                clearCachedToken();
            }
            return parseStkPushErrorBody(
                    ex.getResponseBodyAsString(),
                    humanizeHttpError(ex.getStatusCode().value(), ex.getResponseBodyAsString(), ex.getMessage()));
        } catch (Exception ex) {
            log.warn("STK push initiate failed for {}: {}", formattedPhone, ex.getMessage());
            StkPushResponse response = new StkPushResponse();
            response.setErrorMessage(ex.getMessage());
            return response;
        }
    }

    /**
     * Query the final status of a previously initiated STK push when the callback
     * never arrived (user dismissed the prompt, network drop, ngrok down, etc.).
     */
    public StkPushQueryResponse queryStkPush(String checkoutRequestId) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String password = Base64.getEncoder()
                .encodeToString((shortcode + passkey + timestamp).getBytes());

        StkPushQueryRequest request = new StkPushQueryRequest();
        request.setBusinessShortCode(shortcode);
        request.setPassword(password);
        request.setTimestamp(timestamp);
        request.setCheckoutRequestId(checkoutRequestId);

        log.info("Querying STK push status for CheckoutRequestID {}", checkoutRequestId);

        try {
            return restClient.post()
                    .uri(baseUrl + "/mpesa/stkpushquery/v1/query")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getAccessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(StkPushQueryResponse.class);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 401) {
                clearCachedToken();
            }
            return parseQueryErrorBody(
                    checkoutRequestId,
                    ex.getResponseBodyAsString(),
                    humanizeHttpError(ex.getStatusCode().value(), ex.getResponseBodyAsString(), ex.getMessage()));
        } catch (Exception ex) {
            log.warn("STK push query failed for CheckoutRequestID {}: {}", checkoutRequestId, ex.getMessage());
            return null;
        }
    }

    private void clearCachedToken() {
        cachedAccessToken = null;
        tokenExpiresAt = Instant.EPOCH;
    }

    /**
     * Receipt numbers are delivered only via Safaricom's callback. Localhost/tunnel-less
     * URLs mean the receipt can never be stored automatically.
     */
    private void assertPublicCallbackUrl() {
        if (callbackUrl == null || callbackUrl.isBlank()) {
            throw new IllegalStateException(
                    "M-Pesa callback URL is not configured. Set app.mpesa.callback-url to your public ngrok/cloudflared HTTPS URL.");
        }
        String lower = callbackUrl.toLowerCase(Locale.ROOT);
        if (!lower.startsWith("https://")) {
            throw new IllegalStateException(
                    "M-Pesa callback URL must be HTTPS so Safaricom can deliver the receipt automatically.");
        }
        if (lower.contains("localhost") || lower.contains("127.0.0.1") || lower.contains("0.0.0.0")) {
            throw new IllegalStateException(
                    "M-Pesa callback URL points at localhost. Start ngrok or cloudflared and set "
                            + "app.mpesa.callback-url to that public HTTPS URL before paying.");
        }
    }

    /**
     * Turn Incapsula/HTML/403 noise into an actionable short message for the portal UI.
     */
    static String humanizeHttpError(int status, String body, String fallback) {
        String lowerBody = body != null ? body.toLowerCase(Locale.ROOT) : "";
        boolean waftBlocked = lowerBody.contains("incapsula")
                || lowerBody.contains("_incapsula_resource")
                || lowerBody.contains("request unsuccessful");

        if (status == 403 || waftBlocked) {
            return "Safaricom blocked this network (Incapsula 403). "
                    + "Switch to a mobile hotspot or VPN, wait a few minutes, then retry. "
                    + "This is not an invalid phone/amount error.";
        }
        if (status == 401) {
            return "M-Pesa credentials were rejected. Check consumer key/secret in application-local.yaml.";
        }

        StkPushResponse parsed = new StkPushResponse();
        if (body != null && !body.isBlank() && body.trim().startsWith("{")) {
            Matcher matcher = JSON_STRING_FIELD.matcher(body);
            while (matcher.find()) {
                String field = matcher.group(1);
                String value = matcher.group(2);
                if ("errorMessage".equals(field) || "faultstring".equals(field)) {
                    parsed.setErrorMessage(value);
                    break;
                }
            }
        }
        if (parsed.getErrorMessage() != null) {
            return parsed.getErrorMessage();
        }
        if (fallback != null && fallback.length() > 220) {
            return "HTTP " + status + " from Safaricom";
        }
        return firstNonBlank(fallback, "HTTP " + status + " from Safaricom");
    }

    private StkPushResponse parseStkPushErrorBody(String body, String fallback) {
        StkPushResponse response = new StkPushResponse();
        if (body != null && !body.isBlank() && body.trim().startsWith("{")) {
            Matcher matcher = JSON_STRING_FIELD.matcher(body);
            while (matcher.find()) {
                String field = matcher.group(1);
                String value = matcher.group(2);
                if ("errorCode".equals(field)) {
                    response.setErrorCode(value);
                } else if ("errorMessage".equals(field) || "faultstring".equals(field)) {
                    if (response.getErrorMessage() == null) {
                        response.setErrorMessage(value);
                    }
                }
            }
        }
        if (response.getErrorMessage() == null) {
            response.setErrorMessage(fallback);
        }
        log.warn("STK push error envelope: code={} msg={}", response.getErrorCode(), response.getErrorMessage());
        return response;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a;
        }
        if (b != null && !b.isBlank()) {
            return b;
        }
        return null;
    }

    private StkPushQueryResponse parseQueryErrorBody(String checkoutRequestId, String body, String fallback) {
        StkPushQueryResponse response = new StkPushQueryResponse();
        response.setCheckoutRequestId(checkoutRequestId);
        if (body != null && !body.isBlank() && body.trim().startsWith("{")) {
            Matcher matcher = JSON_STRING_FIELD.matcher(body);
            while (matcher.find()) {
                String field = matcher.group(1);
                String value = matcher.group(2);
                if ("errorCode".equals(field)) {
                    response.setErrorCode(value);
                } else if ("errorMessage".equals(field) || "faultstring".equals(field)) {
                    if (response.getErrorMessage() == null) {
                        response.setErrorMessage(value);
                    }
                }
            }
        }
        if (response.getErrorMessage() == null) {
            response.setErrorMessage(fallback);
        }
        log.info("STK query error envelope for {}: code={} msg={}",
                checkoutRequestId, response.getErrorCode(), response.getErrorMessage());
        return response;
    }

    private String normalizePhoneNumber(String phoneNumber) {
        String digitsOnly = phoneNumber.replaceAll("[^0-9]", "");
        if (digitsOnly.startsWith("0")) {
            return "254" + digitsOnly.substring(1);
        }
        if (digitsOnly.startsWith("254")) {
            return digitsOnly;
        }
        if (digitsOnly.startsWith("7") || digitsOnly.startsWith("1")) {
            return "254" + digitsOnly;
        }
        return digitsOnly;
    }
}
