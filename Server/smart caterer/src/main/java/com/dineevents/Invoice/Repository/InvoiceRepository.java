package com.dineevents.Invoice.Repository;

import com.dineevents.Invoice.Entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice,Long> {

}
