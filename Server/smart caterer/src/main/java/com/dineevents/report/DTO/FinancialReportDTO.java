package com.dineevents.report.DTO;

import com.dineevents.Invoice.Enum.InvoiceStatus;
import com.dineevents.Payment.DTO.Response.PaymentResponseDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class FinancialReportDTO {
    private BigDecimal totalRevenue;
    private BigDecimal totalRefunded;
    private BigDecimal totalOutstanding;
    private BigDecimal totalInvoiced;
    private long invoiceCount;
    private long paidInvoiceCount;
    private long outstandingInvoiceCount;
    private long refundCount;
    private List<MonthlyFinancialEntryDTO> monthly;
    private List<PaymentResponseDTO> payments;
    private List<OutstandingInvoiceEntryDTO> outstandingInvoices;
    private List<PaymentResponseDTO> refunds;

    @Data
    public static class MonthlyFinancialEntryDTO {
        private String month;
        private BigDecimal collected;
        private BigDecimal refunded;
        private BigDecimal net;
        private long paymentCount;
    }

    @Data
    public static class OutstandingInvoiceEntryDTO {
        private Long invoiceId;
        private String invoiceNumber;
        private Long eventId;
        private String eventName;
        private String clientName;
        private BigDecimal amountDue;
        private BigDecimal amountPaid;
        private BigDecimal balance;
        private LocalDate dueDate;
        private InvoiceStatus invoiceStatus;
        private OffsetDateTime createdAt;
        private boolean overdue;
    }
}
