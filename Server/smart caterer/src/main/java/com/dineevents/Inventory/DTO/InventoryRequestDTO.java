package com.dineevents.Inventory.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryRequestDTO {
    private String inventoryName;
    private int inventoryQuantity;
    private double inventoryPrice;
}
