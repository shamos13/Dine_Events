package com.dineevents.Payment.Repository;

import com.dineevents.Payment.Entity.Payment;
import com.dineevents.Payment.Enum.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByCheckoutRequestId(String checkoutRequestId);

    Optional<Payment> findByMpesaReceiptNumberIgnoreCase(String mpesaReceiptNumber);

    List<Payment> findTop20ByOrderByInitiatedAtDesc();

    List<Payment> findByPaymentStatus(PaymentStatus status);

    List<Payment> findByInvoice_InvoiceIdOrderByInitiatedAtDesc(Long invoiceId);

    Optional<Payment> findFirstByInvoice_InvoiceIdAndPaymentStatusAndInitiatedAtAfterOrderByInitiatedAtDesc(
            Long invoiceId,
            PaymentStatus paymentStatus,
            OffsetDateTime initiatedAfter
    );

    List<Payment> findByPaymentStatusAndInitiatedAtBefore(PaymentStatus paymentStatus, OffsetDateTime initiatedBefore);

    List<Payment> findByInvoice_InvoiceIdAndPaymentStatus(Long invoiceId, PaymentStatus paymentStatus);

    List<Payment> findByPhoneNumberAndPaymentStatus(String phoneNumber, PaymentStatus paymentStatus);

    @Query("""
            SELECT p FROM Payment p
            JOIN p.invoice i
            JOIN i.event e
            JOIN e.client c
            WHERE p.paymentId = :paymentId AND c.clientId = :clientId
            """)
    Optional<Payment> findByPaymentIdAndClientId(
            @Param("paymentId") Long paymentId,
            @Param("clientId") Long clientId
    );
}
