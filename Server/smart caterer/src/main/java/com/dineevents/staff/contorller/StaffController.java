package com.dineevents.staff.contorller;


import com.dineevents.staff.DTO.Request.StaffRequestDTO;
import com.dineevents.staff.DTO.Response.StaffResponseDTO;
import com.dineevents.staff.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/staff")
public class StaffController {

    private final StaffService staffService;

    @PostMapping("/new-staff")
    public ResponseEntity<StaffResponseDTO> createStaff(@Valid @RequestBody StaffRequestDTO staffRequestDTO) {
        return  ResponseEntity.ok(staffService.createStaff(staffRequestDTO));
    }

    //Get all staff
    @GetMapping("/all-staff")
    public ResponseEntity<List<StaffResponseDTO>> getAllStaff() {
        return ResponseEntity.ok(staffService.getAllStaff());
    }
}
