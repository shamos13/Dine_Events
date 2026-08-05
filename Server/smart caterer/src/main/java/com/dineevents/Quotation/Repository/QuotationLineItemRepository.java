package com.dineevents.Quotation.Repository;

import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.Quotation.Entity.QuotationLineItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuotationLineItemRepository extends JpaRepository<QuotationLineItem, Long> {
    List<QuotationLineItem> findByInventoryItemAllocation(InventoryItemAllocation allocation);
}
