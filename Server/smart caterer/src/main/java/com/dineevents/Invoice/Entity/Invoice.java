package com.dineevents.Invoice.Entity;

import com.dineevents.Invoice.Enum.InvoiceStatus;
import com.dineevents.Quotation.Entity.Quotation;
import com.dineevents.event.Entity.Event;
import com.dineevents.Payment.Entity.Payment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long invoiceId;

    private String invoiceNumber;

    @OneToOne
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private BigDecimal balance;

    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus invoiceStatus;

    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "invoice")
    private List<Payment> payments = new ArrayList<>();
}
