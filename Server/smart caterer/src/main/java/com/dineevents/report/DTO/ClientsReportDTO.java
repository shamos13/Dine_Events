package com.dineevents.report.DTO;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ClientsReportDTO {
    private long totalClients;
    private long openFeedbackCount;
    private long inProgressFeedbackCount;
    private long resolvedFeedbackCount;
    private List<TopClientEntryDTO> topClients;

    @Data
    public static class TopClientEntryDTO {
        private Long clientId;
        private String clientName;
        private String companyName;
        private String clientEmail;
        private long eventCount;
        private BigDecimal totalPaid;
    }
}
