package com.dineevents.Invoice.Entity;


import com.dineevents.Invoice.Enum.InvoiceStatus;
import com.dineevents.Quotation.Entity.Quotation;
import com.dineevents.event.Entity.Event;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

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

    //relationship with quotation
    @OneToOne
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    // Relationship with Event (Many invoices belong to one event)
    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private BigDecimal balance;

    private LocalDate dueDate;

    private InvoiceStatus invoiceStatus;
    private OffsetDateTime createdAt;

    // Implement this later Relationship with the payment module
    //@OneToMany(mappedBy = "invoice")
    //private List<Payment> payments;
}
