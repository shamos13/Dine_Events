package com.dineevents.Inventory.DTO.Response;


import com.dineevents.Inventory.Enums.PricingType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryAllocationResponse {
    private Long allocationId;
    private String inventoryName;
    private String eventName;
    private PricingType pricingType;

    private Integer quantityAllocated;
    private double unitPriceAtAllocation;
    private double flatRate;

    private double totalCost;
}
