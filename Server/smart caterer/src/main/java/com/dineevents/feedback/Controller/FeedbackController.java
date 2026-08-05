package com.dineevents.feedback.Controller;

import com.dineevents.feedback.DTO.Request.FeedbackUpdateRequestDTO;
import com.dineevents.feedback.DTO.Response.FeedbackResponseDTO;
import com.dineevents.feedback.Service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin view of client feedback (suggestions & complaints) surfaced in the CRM.
 * Clients submit feedback through the portal endpoints.
 */
@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping("/all")
    public ResponseEntity<List<FeedbackResponseDTO>> getAllFeedback() {
        return ResponseEntity.ok(feedbackService.getAllFeedback());
    }

    @PatchMapping("/{feedbackId}")
    public ResponseEntity<FeedbackResponseDTO> updateFeedback(
            @PathVariable Long feedbackId,
            @RequestBody FeedbackUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(feedbackService.updateFeedback(feedbackId, request));
    }
}
