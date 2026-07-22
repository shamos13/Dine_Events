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
    private Integer inventoryQuantity;
    private BigDecimal unitPrice;
}
