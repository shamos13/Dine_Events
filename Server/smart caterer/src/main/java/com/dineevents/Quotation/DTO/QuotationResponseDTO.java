package com.dineevents.Quotation.DTO;

import com.dineevents.Quotation.Enum.QuotationStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class QuotationResponseDTO {
    private Long quotationId;
    private String quotationNumber;
    private String quotationName;
    private Long eventId;
    private String eventName;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private BigDecimal subTotal;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private String discountReason;
    private BigDecimal total;
    private QuotationStatus quotationStatus;
    private LocalDate validUntil;
    private OffsetDateTime createdAt;
    private List<QuotationLineItemResponseDTO> lineItems;
}
