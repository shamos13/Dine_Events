package com.dineevents.staff;


import com.dineevents.staff.DTO.Request.StaffRequestDTO;
import com.dineevents.staff.DTO.Response.StaffResponseDTO;
import com.dineevents.staff.Entity.Staff;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;

    // Create a new Staff
    @Transactional
    public StaffResponseDTO createStaff(StaffRequestDTO staffRequestDTO) {
        log.info("Creating staff with name {}", staffRequestDTO.getStaffName());
        Staff staff = toEntity(staffRequestDTO);

        return toResponseDTO(staffRepository.save(staff));
    }

    // Get all staff
    @Transactional
    public List<StaffResponseDTO> getAllStaff() {
        log.info("Retrieving all staff members");
        return staffRepository.findAll().stream().map(this::toResponseDTO).toList();
    }



    // Mappers
    // DTO to Entity (From Client)
    private Staff toEntity(StaffRequestDTO dto) {
        Staff staff = new Staff();
        staff.setStaffName(dto.getStaffName());
        staff.setStaffRole(dto.getStaffRole());
        staff.setStaffEmail(dto.getStaffEmail());
        staff.setStaffPhone(dto.getStaffPhone());
        staff.setStaffSalary(dto.getStaffSalary());
        staff.setResponsibilities(dto.getResponsibilities());
        return staff;
    }

    // Entity to DTO (From Database)
    private StaffResponseDTO toResponseDTO(Staff staff) {
        StaffResponseDTO dto = new StaffResponseDTO();
        dto.setStaffId(staff.getStaffId());
        dto.setStaffName(staff.getStaffName());
        dto.setStaffRole(staff.getStaffRole());
        dto.setStaffEmail(staff.getStaffEmail());
        dto.setStaffPhone(staff.getStaffPhone());
        dto.setStaffSalary(staff.getStaffSalary());
        dto.setResponsibilities(staff.getResponsibilities());

        return dto;
    }
}
