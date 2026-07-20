package com.dineevents.staff.DTO.Request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffRequestDTO {

    @NotBlank (message = "Name is required")
    private String staffName;

    @Email  //Can be Blank
    private String staffEmail;

    @NotBlank(message = "Phone Number is required")
    private String staffPhone;

    @NotBlank
    private String staffRole;
    @NotNull
    private double staffSalary;

    private List<String> responsibilities;


}
