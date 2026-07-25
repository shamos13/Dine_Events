package com.dineevents.Quotation.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuotationRequestDTO {
    private String quotationNumber;
    private Long eventId;
    private Long clientId;

}
