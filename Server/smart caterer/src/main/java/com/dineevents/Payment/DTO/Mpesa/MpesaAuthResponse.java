package com.dineevents.Payment.DTO.Mpesa;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class MpesaAuthResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("expires_in")
    private String expiresIn;
}
