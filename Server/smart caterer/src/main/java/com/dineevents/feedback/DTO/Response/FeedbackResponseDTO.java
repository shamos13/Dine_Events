package com.dineevents.feedback.DTO.Response;

import com.dineevents.feedback.Enum.FeedbackStatus;
import com.dineevents.feedback.Enum.FeedbackType;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class FeedbackResponseDTO {
    private Long feedbackId;
    private Long clientId;
    private String clientName;
    private String clientEmail;
    private String companyName;
    private FeedbackType feedbackType;
    private String subject;
    private String message;
    private FeedbackStatus feedbackStatus;
    private String adminResponse;
    private OffsetDateTime createdAt;
    private OffsetDateTime resolvedAt;
}
