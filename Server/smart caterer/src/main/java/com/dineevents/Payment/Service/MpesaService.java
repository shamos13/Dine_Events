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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
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

    private final RestClient restClient = RestClient.create();

    public boolean isEnabled() {
        return enabled;
    }

    private String getAccessToken() {
        String credentials = Base64.getEncoder()
                .encodeToString((consumerKey + ":" + consumerSecret).getBytes());

        MpesaAuthResponse response = restClient.get()
                .uri(baseUrl + "/oauth/v1/generate?grant_type=client_credentials")
                .header(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
                .retrieve()
                .body(MpesaAuthResponse.class);

        if (response == null || response.getAccessToken() == null) {
            throw new IllegalStateException("Failed to obtain M-Pesa access token");
        }
        return response.getAccessToken();
    }

    public StkPushResponse initiateStkPush(String phoneNumber, BigDecimal amount, String accountReference) {
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

        return restClient.post()
                .uri(baseUrl + "/mpesa/stkpush/v1/processrequest")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + getAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(StkPushResponse.class);
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
            return parseQueryErrorBody(checkoutRequestId, ex.getResponseBodyAsString(), ex.getMessage());
        } catch (Exception ex) {
            log.warn("STK push query failed for CheckoutRequestID {}: {}", checkoutRequestId, ex.getMessage());
            return null;
        }
    }

    private StkPushQueryResponse parseQueryErrorBody(String checkoutRequestId, String body, String fallback) {
        StkPushQueryResponse response = new StkPushQueryResponse();
        response.setCheckoutRequestId(checkoutRequestId);
        if (body != null && !body.isBlank()) {
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
