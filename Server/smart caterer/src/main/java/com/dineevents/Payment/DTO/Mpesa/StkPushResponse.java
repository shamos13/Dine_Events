package com.dineevents.Payment.DTO.Mpesa;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

// This is the SYNCHRONOUS response to the initiate call — it only confirms the
// prompt was sent to the phone. The actual payment result arrives later via callback.
@Data
public class StkPushResponse {

    @JsonProperty("MerchantRequestID")
    private String merchantRequestId;

    @JsonProperty("CheckoutRequestID")
    private String checkoutRequestId;

    @JsonProperty("ResponseCode")
    private String responseCode;

    @JsonProperty("ResponseDescription")
    private String responseDescription;

    @JsonProperty("CustomerMessage")
    private String customerMessage;

    // Populated instead of the above when the initiate call itself fails validation
    // (bad credentials, malformed shortcode, etc.) rather than the payment failing.
    @JsonProperty("errorCode")
    private String errorCode;

    @JsonProperty("errorMessage")
    private String errorMessage;
}
