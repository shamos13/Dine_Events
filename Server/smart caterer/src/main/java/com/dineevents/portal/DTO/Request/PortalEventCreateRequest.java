package com.dineevents.portal.DTO.Request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class PortalEventCreateRequest {
    @NotBlank(message = "Event name is required")
    private String eventName;

    @Min(value = 1, message = "Guest count must be at least 1")
    private int guestCount;

    @NotBlank(message = "Venue is required")
    private String eventVenue;

    private String eventLocation;

    @NotNull(message = "Event date/time is required")
    @FutureOrPresent(message = "Event date must be in the present or future")
    private OffsetDateTime eventDateTime;

    private OffsetDateTime eventEndDateTime;

    private String specialRequests;

    private List<Long> menuPackageIds;
}
