package com.dineevents.Menu.Controller;

import com.dineevents.Menu.DTO.Request.EventMenuPackageSelectionRequestDTO;
import com.dineevents.Menu.DTO.Response.EventMenuPackageSelectionResponseDTO;
import com.dineevents.Menu.service.EventMenuPackageSelectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/event-menu-selection")
@RequiredArgsConstructor
public class EventMenuPackageSelectionController {

    private final EventMenuPackageSelectionService selectionService;

    @PostMapping("/select")
    public ResponseEntity<EventMenuPackageSelectionResponseDTO> selectPackage(
            @Valid @RequestBody EventMenuPackageSelectionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(selectionService.selectPackageForEvent(dto));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<EventMenuPackageSelectionResponseDTO>> getSelectionsForEvent(
            @PathVariable Long eventId) {
        return ResponseEntity.ok(selectionService.getSelectionsForEvent(eventId));
    }
}