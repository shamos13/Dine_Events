package com.dineevents.event.DTO.Response;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class EventSummaryDTO {
    private Long eventId;
    private String eventName;
    private String eventVenue;
    private int guestCount;
    private OffsetDateTime eventDateTime;
}
