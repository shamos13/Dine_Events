package com.dineevents.Menu.DTO.Request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventMenuPackageSelectionRequestDTO {

    @NotNull(message = "Event Id is required")
    private Long eventId;

    @NotNull(message = "Menu Package Id is required")
    private Long menuPackageId;

    private Integer guestCountOverride; // optional
}