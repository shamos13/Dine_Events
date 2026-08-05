package com.dineevents.staff.DTO.Response;

import com.dineevents.staff.Enum.StaffPricingMethod;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class StaffAssignmentResponse {
    private Long staffAssignmentId;
    private Long staffId;
    private Long eventId;
    private String staffName;
    private String staffRole;
    private String roleForEvent;
    private String eventName;
    private BigDecimal salaryAtAssignment;
    private StaffPricingMethod pricingMethod;
    private String profileImageUrl;
    private String assignmentStatus;
    private List<String> responsibilities;
}
