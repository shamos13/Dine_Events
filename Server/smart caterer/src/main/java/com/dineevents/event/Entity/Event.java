package com.dineevents.event.Entity;

import com.dineevents.client.Entity.Client;
import com.dineevents.event.Enums.EventStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

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

    @Enumerated(EnumType.STRING)
    private EventStatus eventStatus;

    @Column(nullable = false)
    private OffsetDateTime eventDateTime;

    // Relationship with the Client (Many to One)
    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;
}
