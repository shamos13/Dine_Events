package com.dineevents.Quotation.Entity;

import com.dineevents.Quotation.Enum.LineItemType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class QuotationLineItem {

    private Long lineItemId;

    @ManyToOne
    @JoinColumn(name = "quotation_id", nullable = false)
    private Quotation quotation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LineItemType lineItemType;

    private String description;

    @Column(nullable = false)
    private Integer quantity;

    //Snapshot price from Quotation
    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal totalPrice;

    // know where it came from only
    private Long sourceReferenceId;

    // implement QuotationLineDetail Relationship here




}
