package com.dineevents.portal.DTO.Request;

import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Partial update of a client's own booking. Only non-null fields are applied.
 * When menuPackageIds is provided it replaces the current package selections.
 */
@Data
public class PortalEventUpdateRequest {
    private String eventName;

    @Min(value = 1, message = "Guest count must be at least 1")
    private Integer guestCount;

    private String eventVenue;
    private String eventLocation;
    private OffsetDateTime eventDateTime;
    private OffsetDateTime eventEndDateTime;
    private String specialRequests;
    private List<Long> menuPackageIds;
}
