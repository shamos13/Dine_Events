package com.dineevents.report.DTO;

import com.dineevents.staff.Enum.StaffPricingMethod;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class StaffReportDTO {
    private long totalStaff;
    private long totalAssignments;
    private long unassignedStaffCount;
    private BigDecimal totalAssignmentCost;
    private Map<String, Long> roleCounts;
    private List<StaffUtilizationEntryDTO> staff;
    private List<StaffAssignmentEntryDTO> assignments;

    @Data
    public static class StaffUtilizationEntryDTO {
        private Long staffId;
        private String staffName;
        private String staffRole;
        private String staffEmail;
        private String staffPhone;
        private BigDecimal staffSalary;
        private StaffPricingMethod pricingMethod;
        private long assignmentCount;
        private BigDecimal totalEarned;
    }

    @Data
    public static class StaffAssignmentEntryDTO {
        private Long staffAssignmentId;
        private Long staffId;
        private String staffName;
        private String staffRole;
        private String roleForEvent;
        private Long eventId;
        private String eventName;
        private String eventStatus;
        private String eventDateTime;
        private BigDecimal salaryAtAssignment;
        private String assignmentStatus;
    }
}
