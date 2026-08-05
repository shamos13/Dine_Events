package com.dineevents.Payment.Entity;

import com.dineevents.Invoice.Entity.Invoice;
import com.dineevents.Payment.Enum.PaymentMethod;
import com.dineevents.Payment.Enum.PaymentStatus;
import com.dineevents.auth.Entity.AppUser;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    @ManyToOne
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    private String phoneNumber;

    // Safaricom correlation IDs - only populated for MPESA payments.
    // checkoutRequestId is the key the callback uses to find its way back to this row.
    @Column(unique = true)
    private String checkoutRequestId;
    private String merchantRequestId;

    // Only populated once Safaricom confirms via callback
    private String mpesaReceiptNumber;

    private String failureReason;

    // Null for automated M-Pesa payments, set when staff manually logs cash/bank
    @ManyToOne
    @JoinColumn(name = "recorded_by")
    private AppUser recordedBy;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime initiatedAt;
    private OffsetDateTime completedAt;

    @PrePersist
    private void onCreate() {
        this.initiatedAt = OffsetDateTime.now();
    }
}
