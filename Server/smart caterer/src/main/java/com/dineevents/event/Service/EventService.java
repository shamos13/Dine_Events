package com.dineevents.event.Service;

import com.dineevents.client.Entity.Client;
import com.dineevents.client.Repository.ClientRepository;
import com.dineevents.event.DTO.Request.EventRequestDTO;
import com.dineevents.event.DTO.Response.EventResponseDTO;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import com.dineevents.Payment.Service.PaymentService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final ClientRepository clientRepository;
    private final EventConflictService eventConflictService;
    private final PaymentService paymentService;

    public EventResponseDTO createEvent(EventRequestDTO eventRequestDTO) {
        log.info("Creating a new event {}", eventRequestDTO.getEventName());
        eventConflictService.assertNoConfirmedConflict(eventRequestDTO.getEventDateTime(), null);
        Event event = toEntity(eventRequestDTO);
        Event savedEvent = eventRepository.save(event);
        return toResponseDTO(savedEvent);
    }

    public List<EventResponseDTO> getAllEvents() {
        log.info("Retrieving all events");
        return eventRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    public EventResponseDTO getEventById(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + eventId));
        return toResponseDTO(event);
    }

    @Transactional
    public EventResponseDTO updateEventStatus(Long eventId, EventStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("Event status is required");
        }
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + eventId));

        if (status == EventStatus.CONFIRMED && event.getEventStatus() != EventStatus.CONFIRMED) {
            eventConflictService.assertNoConfirmedConflict(event.getEventDateTime(), eventId);
        }

        boolean cancelling = status == EventStatus.CANCELLED && event.getEventStatus() != EventStatus.CANCELLED;
        event.setEventStatus(status);
        Event saved = eventRepository.save(event);

        if (cancelling) {
            var refund = paymentService.processCancellationRefund(saved);
            if (refund != null) {
                log.info("Event {} cancelled; simulated refund of KSh {} (75% policy) issued, ref {}",
                        eventId, refund.getAmount(), refund.getMpesaReceiptNumber());
            }
        }
        return toResponseDTO(saved);
    }

    @Transactional
    public EventResponseDTO updateEventDiscount(Long eventId, BigDecimal discountPercent, String discountReason) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + eventId));

        if (event.getEventStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update discount for a cancelled event");
        }

        BigDecimal percent = discountPercent == null ? BigDecimal.ZERO : discountPercent;
        if (percent.compareTo(BigDecimal.ZERO) < 0 || percent.compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("Discount percent must be between 0 and 100");
        }

        event.setDiscountPercent(percent);
        event.setDiscountReason(discountReason == null || discountReason.isBlank() ? null : discountReason.trim());
        Event saved = eventRepository.save(event);
        log.info("Updated discount for event {} to {}%", eventId, percent);
        return toResponseDTO(saved);
    }

    /**
     * Confirms an event when its invoice is fully paid. No-ops if the event is already
     * confirmed, completed, or cancelled. Enforces the one-confirmed-event-per-day policy.
     */
    @Transactional
    public void confirmEventFromPayment(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + eventId));

        EventStatus current = event.getEventStatus();
        if (current == EventStatus.CONFIRMED
                || current == EventStatus.COMPLETED
                || current == EventStatus.CANCELLED) {
            return;
        }

        if (current != EventStatus.INQUIRY && current != EventStatus.TENTATIVE) {
            return;
        }

        eventConflictService.assertNoConfirmedConflict(event.getEventDateTime(), eventId);
        event.setEventStatus(EventStatus.CONFIRMED);
        eventRepository.save(event);
        log.info("Event {} confirmed after invoice payment (was {})", eventId, current);
    }

    private Event toEntity(EventRequestDTO dto) {
        Event event = new Event();
        event.setEventName(dto.getEventName());
        event.setEventStatus(dto.getEventStatus());
        event.setEventVenue(dto.getEventVenue());
        event.setEventLocation(dto.getEventLocation());
        event.setEventDateTime(dto.getEventDateTime());
        event.setEventEndDateTime(dto.getEventEndDateTime());
        event.setGuestCount(dto.getGuestCount());

        if (dto.getClientId() != null) {
            Client client = clientRepository.findById(dto.getClientId())
                    .orElseThrow(() -> new IllegalArgumentException("Client not found: " + dto.getClientId()));
            event.setClient(client);
        }

        return event;
    }

    public EventResponseDTO toResponseDTO(Event event) {
        EventResponseDTO dto = new EventResponseDTO();
        dto.setEventId(event.getEventId());
        dto.setEventName(event.getEventName());
        dto.setEventStatus(event.getEventStatus());
        dto.setEventVenue(event.getEventVenue());
        dto.setEventLocation(event.getEventLocation());
        dto.setSpecialRequests(event.getSpecialRequests());
        dto.setDiscountPercent(event.getDiscountPercent() == null ? java.math.BigDecimal.ZERO : event.getDiscountPercent());
        dto.setDiscountReason(event.getDiscountReason());
        dto.setEventDateTime(event.getEventDateTime());
        dto.setEventEndDateTime(event.getEventEndDateTime());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setGuestCount(event.getGuestCount());

        if (event.getClient() != null) {
            dto.setClientName(event.getClient().getFirstName() + " " + event.getClient().getLastName());
            dto.setClientEmail(event.getClient().getClientEmail());
            dto.setClientPhone(event.getClient().getClientPhone());
        }
        return dto;
    }
}
