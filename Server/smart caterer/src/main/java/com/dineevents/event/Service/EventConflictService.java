package com.dineevents.event.Service;

import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Enforces the one-confirmed-event-per-day booking policy. A date that already has a
 * CONFIRMED event cannot take another booking, and an event cannot be confirmed if
 * another confirmed event exists on the same date.
 */
@Service
@RequiredArgsConstructor
public class EventConflictService {

    private final EventRepository eventRepository;

    public boolean hasConfirmedConflict(OffsetDateTime eventDateTime, Long excludeEventId) {
        if (eventDateTime == null) {
            return false;
        }
        OffsetDateTime startOfDay = eventDateTime.toLocalDate().atStartOfDay().atOffset(eventDateTime.getOffset());
        OffsetDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
        List<Event> confirmed = eventRepository.findByEventStatusAndEventDateTimeBetween(
                EventStatus.CONFIRMED, startOfDay, endOfDay);
        return confirmed.stream()
                .anyMatch(e -> excludeEventId == null || !e.getEventId().equals(excludeEventId));
    }

    public void assertNoConfirmedConflict(OffsetDateTime eventDateTime, Long excludeEventId) {
        if (hasConfirmedConflict(eventDateTime, excludeEventId)) {
            throw new IllegalStateException(
                    "Another event is already confirmed for "
                            + eventDateTime.toLocalDate()
                            + ". Choose a different date or cancel the conflicting booking first.");
        }
    }
}
