package com.dineevents.Quotation.Entity;

import com.dineevents.Quotation.Enum.QuotationStatus;
import com.dineevents.event.Entity.Event;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long quotationId;
    private String quotationNumber;
    private String QuotationName;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private BigDecimal subTotal;

    @Column(nullable = false)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuotationStatus quotationStatus;

    private LocalDate validUntil;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    //Relationship with Quotation Line items will come here (One Quotation will be linked to many Quotation items)
    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuotationLineItem> lineItems;


    @PrePersist
    private void onCreate(){
        this.createdAt = OffsetDateTime.now();
    }
}
