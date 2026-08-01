package com.dineevents.report.DTO;

import com.dineevents.Payment.DTO.Response.PaymentResponseDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class FinancialReportDTO {
    private BigDecimal totalRevenue;
    private BigDecimal totalRefunded;
    private BigDecimal totalOutstanding;
    private BigDecimal totalInvoiced;
    private long invoiceCount;
    private long paidInvoiceCount;
    private List<MonthlyFinancialEntryDTO> monthly;
    private List<PaymentResponseDTO> payments;

    @Data
    public static class MonthlyFinancialEntryDTO {
        private String month;
        private BigDecimal collected;
        private BigDecimal refunded;
        private BigDecimal net;
        private long paymentCount;
    }
}
