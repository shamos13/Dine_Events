package com.dineevents.staff.contorller;

import com.dineevents.staff.DTO.Request.StaffAssignmentRequestDTO;
import com.dineevents.staff.DTO.Response.StaffAssignmentResponse;
import com.dineevents.staff.Service.StaffAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff-assignment")
@RequiredArgsConstructor
public class StaffAssignmentController {

    private final StaffAssignmentService staffAssignmentService;

    // Create a new staff Assignment
    @PostMapping("/assign-staff")
    public ResponseEntity<StaffAssignmentResponse> createStaffAssignment(
             @Valid @RequestBody StaffAssignmentRequestDTO dto){
        return ResponseEntity.ok(staffAssignmentService.createStaffAssignment(dto));
    }

    @GetMapping("/all-assignments")
    public ResponseEntity<List<StaffAssignmentResponse>> getAllStaffAssignments(){
        return ResponseEntity.ok(staffAssignmentService.getAllStaffAssignments());
    }
}
