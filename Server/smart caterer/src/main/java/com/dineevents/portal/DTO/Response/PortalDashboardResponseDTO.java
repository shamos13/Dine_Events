package com.dineevents.portal.DTO.Response;

import com.dineevents.event.DTO.Response.EventResponseDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PortalDashboardResponseDTO {
    private String clientName;
    private EventResponseDTO nextEvent;
    private BigDecimal totalBudget;
    private BigDecimal totalPaid;
    private BigDecimal totalOutstanding;
    private long pendingInvoiceCount;
    private List<PortalActivityItemDTO> activity;
}
