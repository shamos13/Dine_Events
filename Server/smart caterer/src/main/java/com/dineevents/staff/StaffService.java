package com.dineevents.staff;


import com.dineevents.staff.DTO.Request.StaffRequestDTO;
import com.dineevents.staff.DTO.Response.StaffResponseDTO;
import com.dineevents.staff.Entity.Staff;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;

    // Create a new Staff
    public StaffResponseDTO createStaff(StaffRequestDTO staffRequestDTO) {
        log.info("Creating staff with name {}", staffRequestDTO.getStaffName());
        Staff staff = toEntity(staffRequestDTO);

        return toResponseDTO(staffRepository.save(staff));


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

        return dto;
    }
}
