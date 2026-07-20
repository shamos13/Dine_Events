package com.dineevents.event.Service;

import com.dineevents.event.DTO.Request.EventRequestDTO;
import com.dineevents.event.DTO.Response.EventResponseDTO;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    // Create a new event
    public EventResponseDTO createEvent(EventRequestDTO eventRequestDTO){
        log.info("Creating a new event {}", eventRequestDTO.getEventName());
        Event event = toEntity(eventRequestDTO);
        Event savedEvent = eventRepository.save(event);
        return toResponseDTO(savedEvent);
    }

    // Get all events
    public List<EventResponseDTO> getAllEvents(){
        log.info("Retrieving all events");
        List<Event> events = eventRepository.findAll();
        return events.stream().map(this::toResponseDTO).toList();
    }






    // Mappers
    // DTO to Entity (data from client about to be saved)
    private Event toEntity(EventRequestDTO dto){
        Event event = new Event();
        event.setEventName(dto.getEventName());
        event.setEventStatus(dto.getEventStatus());
        event.setEventVenue(dto.getEventVenue());
        event.setEventDateTime(dto.getEventDateTime());
        event.setGuestCount(dto.getGuestCount());

        return event;
    }

    //Entity to DTO (data from the database)
    private EventResponseDTO toResponseDTO(Event event){
        EventResponseDTO dto = new EventResponseDTO();
        dto.setEventId(event.getEventId());
        dto.setEventName(event.getEventName());
        dto.setEventStatus(event.getEventStatus());
        dto.setEventVenue(event.getEventVenue());
        dto.setEventDateTime(event.getEventDateTime());
        dto.setGuestCount(event.getGuestCount());
        return dto;
    }
}
