package com.dineevents.event.DTO.Request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class EventDiscountUpdateRequest {

    @DecimalMin(value = "0.0", inclusive = true, message = "Discount must be at least 0%")
    @DecimalMax(value = "100.0", inclusive = true, message = "Discount cannot exceed 100%")
    private BigDecimal discountPercent;

    @Size(max = 1000)
    private String discountReason;
}
