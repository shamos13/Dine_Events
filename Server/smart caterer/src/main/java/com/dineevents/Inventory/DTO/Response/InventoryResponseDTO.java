package com.dineevents.Inventory.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryResponseDTO {
    private Long inventoryId;
    private String inventoryName;
    /** Total stock on hand in the catalog. */
    private Integer inventoryQuantity;
    /** Units still free after active event allocations. */
    private Integer availableQuantity;
    private BigDecimal unitPrice;
}
