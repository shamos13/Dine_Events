package com.dineevents.Quotation.DTO;

import com.dineevents.Quotation.Enum.LineItemType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class QuotationLineItemResponseDTO {
    private Long lineItemId;
    private LineItemType lineItemType;
    private String lineItemDescription;
    private BigDecimal quantity;
    private BigDecimal unitPriceAtQuotation;
    private BigDecimal totalPrice;
}
