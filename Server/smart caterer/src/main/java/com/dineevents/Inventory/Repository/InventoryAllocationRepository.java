package com.dineevents.Inventory.Repository;

import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryAllocationRepository extends JpaRepository<InventoryItemAllocation, Long> {
}
