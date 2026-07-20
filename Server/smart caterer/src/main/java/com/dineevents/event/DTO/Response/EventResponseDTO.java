package com.dineevents.event.DTO.Response;

import com.dineevents.event.Enums.EventStatus;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class EventResponseDTO {
    private Long eventId;
    private String eventName;
    private int guestCount;
    private EventStatus eventStatus;
    private String eventVenue;
    private OffsetDateTime eventDateTime;
}
