package com.dineevents.feedback.DTO.Request;

import com.dineevents.feedback.Enum.FeedbackStatus;
import lombok.Data;

@Data
public class FeedbackUpdateRequestDTO {
    private FeedbackStatus feedbackStatus;
    private String adminResponse;
}
