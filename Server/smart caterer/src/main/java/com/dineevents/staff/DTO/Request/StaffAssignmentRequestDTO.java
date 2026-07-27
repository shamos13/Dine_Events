package com.dineevents.staff.DTO.Request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StaffAssignmentRequestDTO {

    @NotNull(message = "Staff Id is required")
    private Long staffId;

    @NotNull(message = "Event Id is required")
    private Long eventId;

    @Positive(message = "Salary must be greater than 0")
    private BigDecimal salaryAtAssignment;
}
