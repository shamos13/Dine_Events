package com.dineevents.Inventory.DTO.Response;


import com.dineevents.Inventory.Enums.PricingType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryAllocationResponse {
    private Long allocationId;
    private Long eventId;
    private Long inventoryId;
    private String inventoryName;
    private String eventName;
    private String clientName;
    private PricingType pricingType;

    private Integer quantityAllocated;
    private BigDecimal unitPriceAtAllocation;
    private BigDecimal flatRate;

    private BigDecimal totalCost;
    /** Remaining units available in catalog after other active allocations. */
    private Integer availableQuantity;
}
