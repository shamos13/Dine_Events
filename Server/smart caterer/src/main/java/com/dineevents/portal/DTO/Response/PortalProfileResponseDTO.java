package com.dineevents.portal.DTO.Response;

import lombok.Data;

@Data
public class PortalProfileResponseDTO {
    private Long clientId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String clientEmail;
    private String clientPhone;
    private String companyName;
    private String profileImageUrl;

    /** Present when email changed and the session tokens were rotated. */
    private String token;
    private String refreshToken;
}
