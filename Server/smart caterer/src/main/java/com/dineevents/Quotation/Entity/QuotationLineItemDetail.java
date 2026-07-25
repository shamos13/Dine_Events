package com.dineevents.Quotation.Entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class QuotationLineItemDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemDetailId;

    @ManyToOne
    @JoinColumn(name = "line_item_id")
    private QuotationLineItem quotationLineItem;

}
