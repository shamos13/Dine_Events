package com.dineevents.Inventory.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryResponseDTO {
    private Long inventoryId;
    private String inventoryName;
    private int inventoryQuantity;
    private double inventoryPrice;
}
