package com.dineevents.Invoice.DTO.Response;

import com.dineevents.Invoice.Enum.InvoiceStatus;
import com.dineevents.Quotation.DTO.QuotationLineItemResponseDTO;
import com.dineevents.Payment.DTO.Response.PaymentResponseDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class InvoiceResponseDTO {
    private Long invoiceId;
    private String invoiceNumber;
    private Long eventId;
    private String eventName;
    private String clientName;
    private String clientPhone;
    private Long quotationId;
    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private BigDecimal balance;
    private LocalDate dueDate;
    private InvoiceStatus invoiceStatus;
    private OffsetDateTime createdAt;
    private List<QuotationLineItemResponseDTO> lineItems;
    private List<PaymentResponseDTO> payments;
}
