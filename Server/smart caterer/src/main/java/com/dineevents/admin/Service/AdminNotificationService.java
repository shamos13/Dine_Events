package com.dineevents.admin.Service;

import com.dineevents.admin.DTO.AdminNotificationDTO;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import com.dineevents.feedback.Entity.Feedback;
import com.dineevents.feedback.Enum.FeedbackStatus;
import com.dineevents.feedback.Repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminNotificationService {

    private static final int MAX_ITEMS = 30;

    private final EventRepository eventRepository;
    private final FeedbackRepository feedbackRepository;

    public List<AdminNotificationDTO> getNotifications() {
        List<AdminNotificationDTO> items = new ArrayList<>();

        List<Event> inquiries = eventRepository.findByEventStatusOrderByCreatedAtDesc(EventStatus.INQUIRY);
        for (Event event : inquiries) {
            String clientName = event.getClient() != null
                    ? event.getClient().getFirstName() + " " + event.getClient().getLastName()
                    : "A client";
            items.add(new AdminNotificationDTO(
                    "event-" + event.getEventId(),
                    "EVENT_INQUIRY",
                    "New event inquiry",
                    clientName + " requested \"" + event.getEventName() + "\"",
                    "/events/" + event.getEventId(),
                    event.getCreatedAt()
            ));
        }

        List<Feedback> openFeedback = feedbackRepository.findByFeedbackStatusOrderByCreatedAtDesc(FeedbackStatus.OPEN);
        for (Feedback feedback : openFeedback) {
            String clientName = feedback.getClient() != null
                    ? feedback.getClient().getFirstName() + " " + feedback.getClient().getLastName()
                    : "A client";
            items.add(new AdminNotificationDTO(
                    "feedback-" + feedback.getFeedbackId(),
                    "FEEDBACK",
                    "New feedback message",
                    clientName + ": " + feedback.getSubject(),
                    "/crm",
                    feedback.getCreatedAt()
            ));
        }

        return items.stream()
                .sorted(Comparator.comparing(
                        AdminNotificationDTO::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .limit(MAX_ITEMS)
                .toList();
    }
}
