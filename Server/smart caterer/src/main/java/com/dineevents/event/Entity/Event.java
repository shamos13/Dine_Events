package com.dineevents.event.Entity;

import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.client.Entity.Client;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.staff.Entity.StaffAssignment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;
    private String eventName;
    private int guestCount;
    private String eventVenue;
    private String eventLocation;

    @Column(length = 2000)
    private String specialRequests;

    @Enumerated(EnumType.STRING)
    private EventStatus eventStatus;

    @Column(nullable = false)
    private OffsetDateTime eventDateTime;
    private OffsetDateTime eventEndDateTime;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @OneToMany(mappedBy = "event")
    private List<InventoryItemAllocation> inventoryItemAllocations;

    @OneToMany(mappedBy = "event")
    private List<StaffAssignment> staffs;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
