package com.dineevents.Quotation.Entity;

import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.Menu.Entity.MenuItem;
import com.dineevents.Quotation.Enum.LineItemType;
import com.dineevents.staff.Entity.Staff;
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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lineItemId;

    @ManyToOne
    @JoinColumn(name = "quotation_id", nullable = false)
    private Quotation quotation;

    // Only one of these three is populated per row, matching lineItemType
    @ManyToOne
    @JoinColumn(name = "menu_item_id")
    private MenuItem menuItem;

    @ManyToOne
    @JoinColumn(name = "allocation_id")
    private InventoryItemAllocation inventoryItemAllocation;

    @ManyToOne
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LineItemType lineItemType;

    private String description;

    @Column(nullable = false)
    private BigDecimal quantity;

    // Snapshotted from the source entity (InventoryItemAllocation/MenuItem/Staff)
    // at the moment the Quotation is generated — immune to later price changes.
    @Column(nullable = false)
    private BigDecimal unitPriceAtQuotation;

    @Column(nullable = false)
    private BigDecimal lineTotal;
}