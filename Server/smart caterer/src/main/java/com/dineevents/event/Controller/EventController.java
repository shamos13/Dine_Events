package com.dineevents.event.Controller;

import com.dineevents.event.DTO.Request.EventRequestDTO;
import com.dineevents.event.DTO.Request.EventStatusUpdateRequest;
import com.dineevents.event.DTO.Response.EventResponseDTO;
import com.dineevents.event.Service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/v1/event")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @PostMapping("/create")
    public ResponseEntity<EventResponseDTO> createEvent(
            @Valid @RequestBody EventRequestDTO eventRequestDTO
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(eventRequestDTO));
    }

    @GetMapping("/all-events")
    public ResponseEntity<List<EventResponseDTO>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<EventResponseDTO> getEventById(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getEventById(eventId));
    }

    @PatchMapping("/{eventId}/status")
    public ResponseEntity<EventResponseDTO> updateEventStatus(
            @PathVariable Long eventId,
            @RequestBody EventStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(eventService.updateEventStatus(eventId, request.getEventStatus()));
    }
}
