package com.dineevents.Inventory.Repository;

import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.event.Entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryAllocationRepository extends JpaRepository<InventoryItemAllocation, Long> {

    List<InventoryItemAllocation> findByEvent(Event event);
}
