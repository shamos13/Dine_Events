package com.dineevents.staff.contorller;


import com.dineevents.staff.DTO.Request.StaffRequestDTO;
import com.dineevents.staff.DTO.Response.StaffResponseDTO;
import com.dineevents.staff.StaffRepository;
import com.dineevents.staff.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/staff")
public class StaffContorller {

    private final StaffService staffService;

    @PostMapping("/new-staff")
    public ResponseEntity<StaffResponseDTO> createStaff(@Valid @RequestBody StaffRequestDTO staffRequestDTO) {
        return  ResponseEntity.ok(staffService.createStaff(staffRequestDTO));
    }
}
