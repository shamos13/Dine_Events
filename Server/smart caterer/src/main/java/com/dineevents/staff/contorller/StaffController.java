package com.dineevents.staff.contorller;


import com.dineevents.staff.DTO.Request.StaffRequestDTO;
import com.dineevents.staff.DTO.Response.StaffResponseDTO;
import com.dineevents.staff.Service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/v1/staff")
public class StaffController {

    private final StaffService staffService;

    @PostMapping("/new-staff")
    public ResponseEntity<StaffResponseDTO> createStaff(@Valid @RequestBody StaffRequestDTO staffRequestDTO) {
        return ResponseEntity.ok(staffService.createStaff(staffRequestDTO));
    }

    @PutMapping("/{staffId}")
    public ResponseEntity<StaffResponseDTO> updateStaff(
            @PathVariable Long staffId,
            @Valid @RequestBody StaffRequestDTO staffRequestDTO
    ) {
        return ResponseEntity.ok(staffService.updateStaff(staffId, staffRequestDTO));
    }

    @GetMapping("/all-staff")
    public ResponseEntity<List<StaffResponseDTO>> getAllStaff() {
        return ResponseEntity.ok(staffService.getAllStaff());
    }
}
