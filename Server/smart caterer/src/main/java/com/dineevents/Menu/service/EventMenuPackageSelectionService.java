package com.dineevents.Menu.service;

import com.dineevents.Menu.DTO.Request.EventMenuPackageSelectionRequestDTO;
import com.dineevents.Menu.DTO.Response.EventMenuPackageSelectionResponseDTO;
import com.dineevents.Menu.Entity.EventMenuPackageSelection;
import com.dineevents.Menu.Entity.MenuPackage;
import com.dineevents.Menu.repository.EventMenuPackageSelectionRepository;
import com.dineevents.Menu.repository.MenuPackageRepository;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Repository.EventRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventMenuPackageSelectionService {

    private final EventMenuPackageSelectionRepository selectionRepository;
    private final EventRepository eventRepository;
    private final MenuPackageRepository menuPackageRepository;

    public EventMenuPackageSelectionResponseDTO selectPackageForEvent(EventMenuPackageSelectionRequestDTO dto) {
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + dto.getEventId()));
        MenuPackage menuPackage = menuPackageRepository.findById(dto.getMenuPackageId())
                .orElseThrow(() -> new EntityNotFoundException("Menu package not found: " + dto.getMenuPackageId()));

        EventMenuPackageSelection selection = new EventMenuPackageSelection();
        selection.setEvent(event);
        selection.setMenuPackage(menuPackage);
        selection.setGuestCountOverride(dto.getGuestCountOverride());

        EventMenuPackageSelection saved = selectionRepository.save(selection);
        return toResponseDTO(saved);
    }

    public List<EventMenuPackageSelectionResponseDTO> getSelectionsForEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + eventId));
        return selectionRepository.findByEvent(event).stream().map(this::toResponseDTO).toList();
    }

    private EventMenuPackageSelectionResponseDTO toResponseDTO(EventMenuPackageSelection selection) {
        EventMenuPackageSelectionResponseDTO dto = new EventMenuPackageSelectionResponseDTO();
        dto.setSelectionId(selection.getSelectionId());
        dto.setEventName(selection.getEvent().getEventName());
        dto.setPackageName(selection.getMenuPackage().getPackageName());
        dto.setPricePerPax(selection.getMenuPackage().getPricePerPax());
        int guestCount = selection.getGuestCountOverride() != null
                ? selection.getGuestCountOverride()
                : selection.getEvent().getGuestCount();
        dto.setGuestCount(guestCount);
        return dto;
    }
}