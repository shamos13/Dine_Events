package com.dineevents.event.Repository;

import com.dineevents.client.Entity.Client;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByClientOrderByEventDateTimeAsc(Client client);

    List<Event> findByClient_ClientIdOrderByEventDateTimeAsc(Long clientId);

    Optional<Event> findByEventIdAndClient_ClientId(Long eventId, Long clientId);

    List<Event> findByEventStatusAndEventDateTimeBetween(EventStatus status, OffsetDateTime start, OffsetDateTime end);

    List<Event> findByEventStatusOrderByCreatedAtDesc(EventStatus status);
}
