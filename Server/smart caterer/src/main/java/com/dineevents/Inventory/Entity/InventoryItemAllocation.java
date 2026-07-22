package com.dineevents.Inventory.Entity;

import com.dineevents.Inventory.Enums.PricingType;
import com.dineevents.event.Entity.Event;
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
@Table(name = "inventory_allocations")
public class InventoryItemAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long allocationId;

    // Mapping the relationships
    @ManyToOne
    @JoinColumn(name = "inventory_id")
    private Inventory inventory;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    // Get the pricing type
    @Enumerated(EnumType.STRING)
    private PricingType pricingType;

    // Per_unit fields null when flat_rate
    private Integer quantityAllocated; //how many units of the item are allocated
    private double unitPrice; //price per unit at the time of allocation - kupeana

    // Flat_Rate fields null when per_unit
    private double flatRate;

    private double totalCost;

    private Integer quantityReturned;
    private String conditionNotes;


}
