package com.dineevents.Inventory.DTO.Request;

import com.dineevents.Inventory.Enums.PricingType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryAllocationUpdateRequest {

    @NotNull(message = "Pricing Type is required")
    private PricingType pricingType;

    private Integer quantityAllocated;

    private BigDecimal flatRate;
}
