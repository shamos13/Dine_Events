package com.dineevents.Payment.DTO.Mpesa;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

// Field names on the wire must match Daraja's exact PascalCase spec, hence the
// @JsonProperty overrides on otherwise idiomatic Java field names.
@Data
public class StkPushRequest {

    @JsonProperty("BusinessShortCode")
    private String businessShortCode;

    @JsonProperty("Password")
    private String password;

    @JsonProperty("Timestamp")
    private String timestamp;

    @JsonProperty("TransactionType")
    private String transactionType;

    @JsonProperty("Amount")
    private String amount;

    @JsonProperty("PartyA")
    private String partyA;

    @JsonProperty("PartyB")
    private String partyB;

    @JsonProperty("PhoneNumber")
    private String phoneNumber;

    @JsonProperty("CallBackURL")
    private String callBackURL;

    @JsonProperty("AccountReference")
    private String accountReference;

    @JsonProperty("TransactionDesc")
    private String transactionDesc;
}
