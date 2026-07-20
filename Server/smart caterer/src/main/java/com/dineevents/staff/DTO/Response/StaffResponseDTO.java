package com.dineevents.staff.DTO.Response;

import lombok.Data;

import java.util.List;

@Data
public class StaffResponseDTO {
    private Long staffId;
    private String staffName;
    private String staffRole;
    private String staffEmail;
    private String staffPhone;
    private double staffSalary;
    private List<String> responsibilities;
}
