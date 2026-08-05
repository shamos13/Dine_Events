package com.dineevents.event.DTO.Request;

import com.dineevents.event.Enums.EventStatus;
import lombok.Data;

@Data
public class EventStatusUpdateRequest {
    private EventStatus eventStatus;
}
