package com.dineevents.event.DTO.Request;

import com.dineevents.event.Enums.EventStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventRequestDTO {

    @NotBlank(message = "Event Name is required")
    private String eventName;

    @NotNull(message = "Guest Count is required")
    private int guestCount;

    @NotNull(message = "Event Status is required")
    private EventStatus eventStatus;

    @NotBlank(message = "Event Venue is required")
    private String eventVenue;

    @FutureOrPresent(message = "Event Date and time must be in the future or present")
    private OffsetDateTime eventDateTime;

    @NotNull(message = "Client Id is required")
    private Long clientId;
}
