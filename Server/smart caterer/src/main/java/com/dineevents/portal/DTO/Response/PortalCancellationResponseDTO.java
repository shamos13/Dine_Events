package com.dineevents.portal.DTO.Response;

import com.dineevents.event.DTO.Response.EventResponseDTO;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PortalCancellationResponseDTO {
    private EventResponseDTO event;
    private BigDecimal totalPaid;
    private BigDecimal refundAmount;
    private String refundReference;
    private String message;
}
