package com.dineevents.Inventory.DTO.Request;


import com.dineevents.Inventory.Enums.PricingType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryAllocationRequest {

    @NotNull
    private Long inventoryId;
    @NotNull
    private Long eventId;

    @NotNull(message = "Pricing Type is required")
    private PricingType pricingType;

    // Per unit fields
    private double unitPrice;
    private Integer quantityAllocated;

    // Flat rate fields
    private double flatRate;

    private double totalCost;
}
