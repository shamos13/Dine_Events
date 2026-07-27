package com.dineevents.staff.DTO.Request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StaffAssignmentRequestDTO {

    @NotNull(message = "Staff Id is required")
    private Long staffId;

    @NotNull(message = "Event Id is required")
    private Long eventId;
}
