package com.dineevents.Quotation.Repository;

import com.dineevents.Quotation.Entity.QuotationLineItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotationLineItemRepository extends JpaRepository<QuotationLineItem,Long> {
}
