package com.dineevents.staff.Service;

import com.dineevents.event.Entity.Event;
import com.dineevents.event.Repository.EventRepository;
import com.dineevents.staff.DTO.Request.StaffAssignmentRequestDTO;
import com.dineevents.staff.DTO.Response.StaffAssignmentResponse;
import com.dineevents.staff.Entity.Staff;
import com.dineevents.staff.Entity.StaffAssignment;
import com.dineevents.staff.Repository.StaffAssignmentRepository;
import com.dineevents.staff.Repository.StaffRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Slf4j
@Service
public class StaffAssignmentService {

    private final StaffAssignmentRepository staffAssignmentRepository;
    private final EventRepository eventRepository;
    private final StaffRepository staffRepository;

    // Create a new staff assignment
    public StaffAssignmentResponse createStaffAssignment(StaffAssignmentRequestDTO staffAssignmentRequestDTO){
        log.info("Creating a new staff assignment for EventID {}", staffAssignmentRequestDTO.getEventId());
        StaffAssignment staffAssignment = toEntity(staffAssignmentRequestDTO);
        StaffAssignment savedStaffAssignment = staffAssignmentRepository.save(staffAssignment);
        return toResponseDTO(savedStaffAssignment);
    }

    // Get all staff assignments
    public List<StaffAssignmentResponse> getAllStaffAssignments(){
        log.info("Retrieving all staff assignments");
        return staffAssignmentRepository.findAll().stream().map(this::toResponseDTO).toList();
    }


    // Mappers DTO to Entity(From Client)
    public StaffAssignment toEntity(StaffAssignmentRequestDTO dto){
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() ->new EntityNotFoundException("Event not found: " + dto.getEventId()));

        Staff staff = staffRepository.findById(dto.getStaffId())
                .orElseThrow(() ->new EntityNotFoundException("Staff not found: " + dto.getStaffId()));
        StaffAssignment staffAssignment = new StaffAssignment();
        staffAssignment.setEvent(event);
        staffAssignment.setStaff(staff);
        return staffAssignment;
    }

    // Entity to DTO
    public StaffAssignmentResponse toResponseDTO(StaffAssignment staffAssignment){
        StaffAssignmentResponse response = new StaffAssignmentResponse();
        response.setStaffAssignmentId(staffAssignment.getStaffAssignmentId());
        response.setStaffName(staffAssignment.getStaff().getStaffName());
        response.setEventName(staffAssignment.getEvent().getEventName());
        return response;
    }
}
