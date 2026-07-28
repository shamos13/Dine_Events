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
    private String eventLocation;
    private OffsetDateTime eventDateTime;
    private OffsetDateTime eventEndDateTime;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
}
