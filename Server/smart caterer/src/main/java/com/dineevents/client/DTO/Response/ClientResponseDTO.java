package com.dineevents.client.DTO.Response;

import lombok.Data;

@Data
public class ClientResponseDTO {
    private Long clientId;
    private String fullName;
    private String clientEmail;
    private String clientPhone;
    private String companyName;
}
