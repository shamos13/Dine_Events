package com.dineevents.staff.Service;

import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import com.dineevents.staff.DTO.Request.StaffAssignmentRequestDTO;
import com.dineevents.staff.DTO.Response.StaffAssignmentResponse;
import com.dineevents.staff.Entity.Staff;
import com.dineevents.staff.Entity.StaffAssignment;
import com.dineevents.staff.Enum.AssignmentStatus;
import com.dineevents.staff.Enum.StaffPricingMethod;
import com.dineevents.staff.Repository.StaffAssignmentRepository;
import com.dineevents.staff.Repository.StaffRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public List<StaffAssignmentResponse> getStaffAssignmentsByEventId(Long eventId){
        log.info("Retrieving staff assignments for EventID {}", eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + eventId));
        return staffAssignmentRepository.findByEvent(event).stream().map(this::toResponseDTO).toList();
    }

    @Transactional
    public void removeStaffAssignment(Long staffAssignmentId) {
        StaffAssignment assignment = staffAssignmentRepository.findById(staffAssignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Staff assignment not found: " + staffAssignmentId));
        if (assignment.getEvent().getEventStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot modify staff for a cancelled event");
        }
        staffAssignmentRepository.delete(assignment);
    }

    // Mappers DTO to Entity(From Client)
    public StaffAssignment toEntity(StaffAssignmentRequestDTO dto){
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() ->new EntityNotFoundException("Event not found: " + dto.getEventId()));

        if (event.getEventStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot assign staff to a cancelled event");
        }

        Staff staff = staffRepository.findById(dto.getStaffId())
                .orElseThrow(() ->new EntityNotFoundException("Staff not found: " + dto.getStaffId()));
        StaffAssignment staffAssignment = new StaffAssignment();
        staffAssignment.setEvent(event);
        staffAssignment.setStaff(staff);

        // Snapshot the staff salary unless a custom assignment salary is provided.
        staffAssignment.setSalaryAtAssignment(dto.getSalaryAtAssignment() != null ? dto.getSalaryAtAssignment() : staff.getStaffSalary());
        staffAssignment.setRoleForEvent(staff.getStaffRole());
        staffAssignment.setAssignmentStatus(AssignmentStatus.ASSIGNED);
        return staffAssignment;
    }

    // Entity to DTO
    public StaffAssignmentResponse toResponseDTO(StaffAssignment staffAssignment){
        StaffAssignmentResponse response = new StaffAssignmentResponse();
        response.setStaffAssignmentId(staffAssignment.getStaffAssignmentId());
        Staff staff = staffAssignment.getStaff();
        Event event = staffAssignment.getEvent();
        response.setStaffId(staff.getStaffId());
        response.setEventId(event.getEventId());
        response.setStaffName(staff.getStaffName());
        response.setStaffRole(staff.getStaffRole());
        response.setRoleForEvent(staffAssignment.getRoleForEvent());
        response.setEventName(event.getEventName());
        response.setSalaryAtAssignment(staffAssignment.getSalaryAtAssignment());
        response.setPricingMethod(staff.getPricingMethod() != null ? staff.getPricingMethod() : StaffPricingMethod.FLAT_RATE);
        response.setProfileImageUrl(staff.getProfileImageUrl());
        response.setAssignmentStatus(staffAssignment.getAssignmentStatus() != null ? staffAssignment.getAssignmentStatus().name() : null);
        response.setResponsibilities(staff.getResponsibilities());
        return response;
    }
}
