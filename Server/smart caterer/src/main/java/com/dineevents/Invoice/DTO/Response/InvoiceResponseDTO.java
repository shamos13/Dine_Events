package com.dineevents.Invoice.DTO.Response;


import com.dineevents.Invoice.Enum.InvoiceStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
public class InvoiceResponseDTO {
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

}
