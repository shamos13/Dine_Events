package com.dineevents.client.Entity;

import com.dineevents.event.Entity.Event;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long clientId;
    private String firstName;
    private String lastName;
    private String clientEmail;
    private String clientPhone;

    private String companyName;
    private String profileImageUrl;

    @Column(updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "client")
    private List<Event> events;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
