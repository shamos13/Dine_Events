package com.dineevents.report.DTO;

import com.dineevents.event.DTO.Response.EventResponseDTO;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class EventsReportDTO {
    private long totalEvents;
    private Map<String, Long> statusCounts;
    private long upcomingCount;
    private long totalGuests;
    private List<MonthlyCountEntryDTO> monthly;
    private List<EventResponseDTO> events;

    @Data
    public static class MonthlyCountEntryDTO {
        private String month;
        private long count;
        private long guests;
    }
}
