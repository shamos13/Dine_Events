package com.dineevents.report.DTO;

import com.dineevents.Inventory.Enums.PricingType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class InventoryReportDTO {
    private long totalItems;
    private long totalStockUnits;
    private long totalAllocatedUnits;
    private long lowStockCount;
    private long outOfStockCount;
    private BigDecimal totalAllocationValue;
    private List<InventoryStockEntryDTO> items;
    private List<InventoryAllocationEntryDTO> allocations;

    @Data
    public static class InventoryStockEntryDTO {
        private Long inventoryId;
        private String inventoryName;
        private Integer stockQuantity;
        private Integer allocatedQuantity;
        private Integer availableQuantity;
        private BigDecimal unitPrice;
        private BigDecimal stockValue;
        private int utilizationPercent;
    }

    @Data
    public static class InventoryAllocationEntryDTO {
        private Long allocationId;
        private Long inventoryId;
        private String inventoryName;
        private Long eventId;
        private String eventName;
        private String eventStatus;
        private String clientName;
        private PricingType pricingType;
        private Integer quantityAllocated;
        private Integer quantityReturned;
        private BigDecimal totalCost;
    }
}
