package com.dineevents.Quotation.Repository;

import com.dineevents.Quotation.Entity.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    List<Quotation> findByEvent_EventId(Long eventId);

    List<Quotation> findByEvent_Client_ClientIdOrderByCreatedAtDesc(Long clientId);

    Optional<Quotation> findByQuotationIdAndEvent_Client_ClientId(Long quotationId, Long clientId);
}
