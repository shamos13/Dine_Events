package com.dineevents.client.service;

import com.dineevents.client.DTO.Request.ClientRequestDTO;
import com.dineevents.client.DTO.Response.ClientResponseDTO;
import com.dineevents.client.Entity.Client;
import com.dineevents.client.Repository.ClientRepository;
import com.dineevents.event.DTO.Response.EventResponseDTO;
import com.dineevents.event.DTO.Response.EventSummaryDTO;
import com.dineevents.event.Entity.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientService {
    private final ClientRepository clientRepository;

    // Adding a new client
    public ClientResponseDTO createClient(ClientRequestDTO clientRequestDTO){
        log.info("Creating a new client {}", clientRequestDTO.getFirstName());

        // Save to DB
        Client client = toEntity(clientRequestDTO);
        Client savedClient = clientRepository.save(client);

        return toResponseDTO(savedClient);
    }

    // Retrieve all clients
    public List<ClientResponseDTO> getAllClients(){
        log.info("Retrieving all clients");
        List<Client> clients = clientRepository.findAll();
        return clients.stream().map(this::toResponseDTO).toList();
    }






    // DTO Mappers
    // DTO to Entity (data from client about to be saved)
    public Client toEntity(ClientRequestDTO dto){
        Client client = new Client();
        client.setFirstName(dto.getFirstName());
        client.setLastName(dto.getLastName());
        client.setClientEmail(dto.getClientEmail());
        client.setClientPhone(dto.getClientPhone());
        client.setCompanyName(dto.getCompanyName());
        return client;
    }

    // Entity to DTO (data from the database)
    public ClientResponseDTO toResponseDTO(Client client){
        ClientResponseDTO clientResponseDTO = new ClientResponseDTO();
        clientResponseDTO.setClientId(client.getClientId());
        clientResponseDTO.setFullName(client.getFirstName() + " " + client.getLastName());
        clientResponseDTO.setClientEmail(client.getClientEmail());
        clientResponseDTO.setClientPhone(client.getClientPhone());
        clientResponseDTO.setCompanyName(client.getCompanyName());

        // Get the number of events for this client
        if (client.getEvents() != null){
            List<EventSummaryDTO> events = client.getEvents().stream()
                    .map(event -> {
                        EventSummaryDTO dto = new EventSummaryDTO();
                        dto.setEventId(event.getEventId());
                        dto.setEventName(event.getEventName());
                        dto.setEventVenue(event.getEventVenue());
                        dto.setEventDateTime(event.getEventDateTime());
                        dto.setGuestCount(event.getGuestCount());
                        return dto;
                    }).toList();
            clientResponseDTO.setEvents(events);
        }
        return clientResponseDTO;
    }
}