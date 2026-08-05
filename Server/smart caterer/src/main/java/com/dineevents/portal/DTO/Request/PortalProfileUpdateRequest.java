package com.dineevents.portal.DTO.Request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PortalProfileUpdateRequest {
    @NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String clientEmail;

    @NotBlank(message = "Phone number is required")
    private String clientPhone;

    private String companyName;

    private String profileImageUrl;
}
