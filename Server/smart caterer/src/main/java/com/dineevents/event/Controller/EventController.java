package com.dineevents.event.Controller;

import com.dineevents.event.DTO.Request.EventRequestDTO;
import com.dineevents.event.DTO.Response.EventResponseDTO;
import com.dineevents.event.Service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/event")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @PostMapping("/create")
    public ResponseEntity<EventResponseDTO> createEvent(
            @Valid @RequestBody EventRequestDTO eventRequestDTO
            ){
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(eventRequestDTO));
    }
}
