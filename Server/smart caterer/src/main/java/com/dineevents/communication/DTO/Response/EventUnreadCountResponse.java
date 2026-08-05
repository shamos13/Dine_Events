package com.dineevents.communication.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventUnreadCountResponse {
    private Long eventId;
    private long unreadCount;
}
