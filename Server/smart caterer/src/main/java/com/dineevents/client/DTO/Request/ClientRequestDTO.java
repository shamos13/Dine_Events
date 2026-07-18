package com.dineevents.client.DTO.Request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClientRequestDTO {

    @NotBlank(message = "Name is Required")
    private String firstName;
    private String lastName;
    @Email
    private String clientEmail;
    @NotBlank(message = "Phone number is required")
    private String clientPhone;
    private String companyName;
}
