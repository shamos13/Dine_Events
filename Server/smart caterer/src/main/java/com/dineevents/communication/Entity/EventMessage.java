package com.dineevents.communication.Entity;

import com.dineevents.Quotation.Entity.Quotation;
import com.dineevents.communication.Enum.MessageKind;
import com.dineevents.communication.Enum.MessageSender;
import com.dineevents.event.Entity.Event;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "event_messages")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageSender sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageKind messageKind;

    @Column(nullable = false, length = 4000)
    private String body;

    @Column(nullable = false)
    private boolean readByAdmin;

    @Column(nullable = false)
    private boolean readByClient;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (messageKind == null) {
            messageKind = MessageKind.GENERAL;
        }
    }
}
