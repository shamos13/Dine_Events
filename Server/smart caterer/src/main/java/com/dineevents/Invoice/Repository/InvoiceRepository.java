package com.dineevents.Invoice.Repository;

import com.dineevents.Invoice.Entity.Invoice;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByEvent_EventId(Long eventId);

    List<Invoice> findByEvent_Client_ClientIdOrderByCreatedAtDesc(Long clientId);

    Optional<Invoice> findByInvoiceIdAndEvent_Client_ClientId(Long invoiceId, Long clientId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invoice i WHERE i.invoiceId = :invoiceId")
    Optional<Invoice> findByIdForUpdate(@Param("invoiceId") Long invoiceId);
}
