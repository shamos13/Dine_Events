package com.dineevents.staff.Service;

import com.dineevents.staff.DTO.Request.StaffRequestDTO;
import com.dineevents.staff.DTO.Response.StaffResponseDTO;
import com.dineevents.staff.Entity.Staff;
import com.dineevents.staff.Enum.StaffPricingMethod;
import com.dineevents.staff.Repository.StaffRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;

    @Transactional
    public StaffResponseDTO createStaff(StaffRequestDTO staffRequestDTO) {
        log.info("Creating staff with name {}", staffRequestDTO.getStaffName());
        Staff staff = toEntity(staffRequestDTO);
        return toResponseDTO(staffRepository.save(staff));
    }

    @Transactional
    public StaffResponseDTO updateStaff(Long staffId, StaffRequestDTO staffRequestDTO) {
        log.info("Updating staff {}", staffId);
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Staff not found: " + staffId));
        applyRequest(staff, staffRequestDTO);
        return toResponseDTO(staffRepository.save(staff));
    }

    @Transactional
    public List<StaffResponseDTO> getAllStaff() {
        log.info("Retrieving all staff members");
        return staffRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    private Staff toEntity(StaffRequestDTO dto) {
        Staff staff = new Staff();
        applyRequest(staff, dto);
        return staff;
    }

    private void applyRequest(Staff staff, StaffRequestDTO dto) {
        staff.setStaffName(dto.getStaffName());
        staff.setStaffRole(dto.getStaffRole());
        staff.setStaffEmail(dto.getStaffEmail());
        staff.setStaffPhone(dto.getStaffPhone());
        staff.setStaffSalary(dto.getStaffSalary());
        staff.setPricingMethod(dto.getPricingMethod() != null ? dto.getPricingMethod() : StaffPricingMethod.FLAT_RATE);
        staff.setProfileImageUrl(blankToNull(dto.getProfileImageUrl()));
        staff.setResponsibilities(dto.getResponsibilities() != null ? dto.getResponsibilities() : new ArrayList<>());
    }

    private StaffResponseDTO toResponseDTO(Staff staff) {
        StaffResponseDTO dto = new StaffResponseDTO();
        dto.setStaffId(staff.getStaffId());
        dto.setStaffName(staff.getStaffName());
        dto.setStaffRole(staff.getStaffRole());
        dto.setStaffEmail(staff.getStaffEmail());
        dto.setStaffPhone(staff.getStaffPhone());
        dto.setStaffSalary(staff.getStaffSalary());
        dto.setPricingMethod(staff.getPricingMethod() != null ? staff.getPricingMethod() : StaffPricingMethod.FLAT_RATE);
        dto.setProfileImageUrl(staff.getProfileImageUrl());
        dto.setResponsibilities(staff.getResponsibilities());
        return dto;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
