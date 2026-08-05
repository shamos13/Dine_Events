package com.dineevents.communication.Service;

import com.dineevents.Quotation.Entity.Quotation;
import com.dineevents.Quotation.Repository.QuotationRepository;
import com.dineevents.common.CurrentUserService;
import com.dineevents.communication.DTO.Request.EventMessageRequest;
import com.dineevents.communication.DTO.Response.EventMessageResponse;
import com.dineevents.communication.DTO.Response.EventUnreadCountResponse;
import com.dineevents.communication.Entity.EventMessage;
import com.dineevents.communication.Enum.MessageKind;
import com.dineevents.communication.Enum.MessageSender;
import com.dineevents.communication.Repository.EventMessageRepository;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Repository.EventRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventMessageService {

    private final EventMessageRepository eventMessageRepository;
    private final EventRepository eventRepository;
    private final QuotationRepository quotationRepository;
    private final CurrentUserService currentUserService;

    public List<EventMessageResponse> getMessagesForEvent(Long eventId) {
        requireEvent(eventId);
        return eventMessageRepository.findByEvent_EventIdOrderByCreatedAtAsc(eventId)
                .stream().map(this::toResponse).toList();
    }

    public List<EventMessageResponse> getMessagesForOwnedEvent(Long eventId) {
        Event event = requireOwnedEvent(eventId);
        return eventMessageRepository.findByEventOrderByCreatedAtAsc(event)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public EventMessageResponse postAsAdmin(Long eventId, EventMessageRequest request) {
        Event event = requireEvent(eventId);
        EventMessage message = buildMessage(event, request, MessageSender.ADMIN);
        message.setReadByAdmin(true);
        message.setReadByClient(false);
        EventMessage saved = eventMessageRepository.save(message);
        log.info("Admin posted message {} on event {}", saved.getMessageId(), eventId);
        return toResponse(saved);
    }

    @Transactional
    public EventMessageResponse postAsClient(Long eventId, EventMessageRequest request) {
        Event event = requireOwnedEvent(eventId);
        EventMessage message = buildMessage(event, request, MessageSender.CLIENT);
        message.setReadByAdmin(false);
        message.setReadByClient(true);
        EventMessage saved = eventMessageRepository.save(message);
        log.info("Client posted message {} on event {}", saved.getMessageId(), eventId);
        return toResponse(saved);
    }

    @Transactional
    public EventUnreadCountResponse markAdminRead(Long eventId) {
        Event event = requireEvent(eventId);
        List<EventMessage> unread = eventMessageRepository.findByEventOrderByCreatedAtAsc(event).stream()
                .filter(message -> message.getSender() == MessageSender.CLIENT && !message.isReadByAdmin())
                .toList();
        for (EventMessage message : unread) {
            message.setReadByAdmin(true);
        }
        if (!unread.isEmpty()) {
            eventMessageRepository.saveAll(unread);
        }
        return new EventUnreadCountResponse(eventId, 0);
    }

    public EventUnreadCountResponse getAdminUnreadCount(Long eventId) {
        requireEvent(eventId);
        long count = eventMessageRepository.countByEvent_EventIdAndSenderAndReadByAdminFalse(eventId, MessageSender.CLIENT);
        return new EventUnreadCountResponse(eventId, count);
    }

    public long countAllAdminUnread() {
        return eventMessageRepository.countBySenderAndReadByAdminFalse(MessageSender.CLIENT);
    }

    public List<EventMessage> findUnreadClientMessages() {
        return eventMessageRepository.findBySenderAndReadByAdminFalseOrderByCreatedAtDesc(MessageSender.CLIENT);
    }

    private EventMessage buildMessage(Event event, EventMessageRequest request, MessageSender sender) {
        EventMessage message = new EventMessage();
        message.setEvent(event);
        message.setSender(sender);
        message.setBody(request.getBody().trim());
        message.setMessageKind(request.getMessageKind() == null ? MessageKind.GENERAL : request.getMessageKind());

        if (request.getQuotationId() != null) {
            Quotation quotation = quotationRepository.findById(request.getQuotationId())
                    .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + request.getQuotationId()));
            if (!quotation.getEvent().getEventId().equals(event.getEventId())) {
                throw new IllegalArgumentException("Quotation does not belong to this event");
            }
            message.setQuotation(quotation);
            if (message.getMessageKind() == MessageKind.GENERAL) {
                message.setMessageKind(MessageKind.QUOTATION_FLAG);
            }
        }
        return message;
    }

    private Event requireEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + eventId));
    }

    private Event requireOwnedEvent(Long eventId) {
        Event event = requireEvent(eventId);
        Long clientId = currentUserService.requireCurrentClientId();
        if (event.getClient() == null || !event.getClient().getClientId().equals(clientId)) {
            throw new EntityNotFoundException("Event not found: " + eventId);
        }
        return event;
    }

    private EventMessageResponse toResponse(EventMessage message) {
        EventMessageResponse dto = new EventMessageResponse();
        dto.setMessageId(message.getMessageId());
        dto.setEventId(message.getEvent().getEventId());
        if (message.getQuotation() != null) {
            dto.setQuotationId(message.getQuotation().getQuotationId());
            dto.setQuotationNumber(message.getQuotation().getQuotationNumber());
        }
        dto.setSender(message.getSender());
        dto.setMessageKind(message.getMessageKind());
        dto.setBody(message.getBody());
        dto.setReadByAdmin(message.isReadByAdmin());
        dto.setReadByClient(message.isReadByClient());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }
}
