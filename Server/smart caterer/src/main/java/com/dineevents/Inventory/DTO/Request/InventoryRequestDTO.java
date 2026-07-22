package com.dineevents.Inventory.DTO.Request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryRequestDTO {
    private String inventoryName;
    private Integer inventoryQuantity;
    private BigDecimal unitPrice;
}
