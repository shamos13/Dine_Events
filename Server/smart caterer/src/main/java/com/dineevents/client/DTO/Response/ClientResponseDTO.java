package com.dineevents.client.DTO.Response;

import com.dineevents.event.DTO.Response.EventSummaryDTO;
import lombok.Data;

import java.util.List;

@Data
public class ClientResponseDTO {
    private Long clientId;
    private String fullName;
    private String clientEmail;
    private String clientPhone;
    private String companyName;

    // Get events associated with the client
    private List<EventSummaryDTO> events;

}
