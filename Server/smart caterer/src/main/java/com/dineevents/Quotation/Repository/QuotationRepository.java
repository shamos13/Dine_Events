package com.dineevents.Quotation.Repository;

import com.dineevents.Quotation.Entity.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotationRepository extends JpaRepository<Quotation,Long> {
}
