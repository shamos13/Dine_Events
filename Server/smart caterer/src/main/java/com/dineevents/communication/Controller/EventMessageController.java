package com.dineevents.communication.Controller;

import com.dineevents.communication.DTO.Request.EventMessageRequest;
import com.dineevents.communication.DTO.Response.EventMessageResponse;
import com.dineevents.communication.DTO.Response.EventUnreadCountResponse;
import com.dineevents.communication.Service.EventMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events/{eventId}/messages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class EventMessageController {

    private final EventMessageService eventMessageService;

    @GetMapping
    public ResponseEntity<List<EventMessageResponse>> getMessages(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventMessageService.getMessagesForEvent(eventId));
    }

    @PostMapping
    public ResponseEntity<EventMessageResponse> postMessage(
            @PathVariable Long eventId,
            @Valid @RequestBody EventMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventMessageService.postAsAdmin(eventId, request));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<EventUnreadCountResponse> unreadCount(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventMessageService.getAdminUnreadCount(eventId));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<EventUnreadCountResponse> markRead(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventMessageService.markAdminRead(eventId));
    }
}
