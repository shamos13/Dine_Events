package com.dineevents.feedback.Service;

import com.dineevents.client.Entity.Client;
import com.dineevents.common.CurrentUserService;
import com.dineevents.feedback.DTO.Request.FeedbackRequestDTO;
import com.dineevents.feedback.DTO.Request.FeedbackUpdateRequestDTO;
import com.dineevents.feedback.DTO.Response.FeedbackResponseDTO;
import com.dineevents.feedback.Entity.Feedback;
import com.dineevents.feedback.Enum.FeedbackStatus;
import com.dineevents.feedback.Repository.FeedbackRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public FeedbackResponseDTO submitFeedback(FeedbackRequestDTO request) {
        Client client = currentUserService.requireCurrentClient();

        Feedback feedback = new Feedback();
        feedback.setClient(client);
        feedback.setFeedbackType(request.getFeedbackType());
        feedback.setSubject(request.getSubject().trim());
        feedback.setMessage(request.getMessage().trim());
        feedback.setFeedbackStatus(FeedbackStatus.OPEN);

        Feedback saved = feedbackRepository.save(feedback);
        log.info("Client {} submitted {} feedback: {}", client.getClientId(), request.getFeedbackType(), saved.getFeedbackId());
        return toResponseDTO(saved);
    }

    public List<FeedbackResponseDTO> getMyFeedback() {
        Long clientId = currentUserService.requireCurrentClientId();
        return feedbackRepository.findByClient_ClientIdOrderByCreatedAtDesc(clientId)
                .stream().map(this::toResponseDTO).toList();
    }

    public List<FeedbackResponseDTO> getAllFeedback() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponseDTO).toList();
    }

    @Transactional
    public FeedbackResponseDTO updateFeedback(Long feedbackId, FeedbackUpdateRequestDTO request) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new EntityNotFoundException("Feedback not found: " + feedbackId));

        if (request.getFeedbackStatus() != null) {
            feedback.setFeedbackStatus(request.getFeedbackStatus());
            feedback.setResolvedAt(request.getFeedbackStatus() == FeedbackStatus.RESOLVED
                    ? OffsetDateTime.now()
                    : null);
        }
        if (request.getAdminResponse() != null) {
            feedback.setAdminResponse(request.getAdminResponse().trim());
        }
        return toResponseDTO(feedbackRepository.save(feedback));
    }

    public long countByStatus(FeedbackStatus status) {
        return feedbackRepository.countByFeedbackStatus(status);
    }

    private FeedbackResponseDTO toResponseDTO(Feedback feedback) {
        FeedbackResponseDTO dto = new FeedbackResponseDTO();
        dto.setFeedbackId(feedback.getFeedbackId());
        Client client = feedback.getClient();
        if (client != null) {
            dto.setClientId(client.getClientId());
            dto.setClientName((client.getFirstName() + " "
                    + (client.getLastName() == null ? "" : client.getLastName())).trim());
            dto.setClientEmail(client.getClientEmail());
            dto.setCompanyName(client.getCompanyName());
        }
        dto.setFeedbackType(feedback.getFeedbackType());
        dto.setSubject(feedback.getSubject());
        dto.setMessage(feedback.getMessage());
        dto.setFeedbackStatus(feedback.getFeedbackStatus());
        dto.setAdminResponse(feedback.getAdminResponse());
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setResolvedAt(feedback.getResolvedAt());
        return dto;
    }
}
