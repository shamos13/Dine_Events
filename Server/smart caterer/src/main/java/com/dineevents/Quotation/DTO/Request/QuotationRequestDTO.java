package com.dineevents.Quotation.DTO.Request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuotationRequestDTO {

    @NotNull(message = "Event Id is required")
    private Long eventId;
    private String quotationName;
    private LocalDate validUntil;
}
