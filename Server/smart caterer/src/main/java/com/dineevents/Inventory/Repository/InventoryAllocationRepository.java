package com.dineevents.Inventory.Repository;

import com.dineevents.Inventory.Entity.Inventory;
import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryAllocationRepository extends JpaRepository<InventoryItemAllocation, Long> {

    List<InventoryItemAllocation> findByEvent(Event event);

    List<InventoryItemAllocation> findByInventory(Inventory inventory);

    @Query("""
            SELECT COALESCE(SUM(a.quantityAllocated), 0)
            FROM InventoryItemAllocation a
            WHERE a.inventory.inventoryId = :inventoryId
              AND a.event.eventStatus <> :cancelled
              AND (:excludeAllocationId IS NULL OR a.allocationId <> :excludeAllocationId)
            """)
    Long sumAllocatedQuantity(
            @Param("inventoryId") Long inventoryId,
            @Param("cancelled") EventStatus cancelled,
            @Param("excludeAllocationId") Long excludeAllocationId
    );
}
