package com.dineevents.client.service;

import com.dineevents.client.DTO.Request.ClientRequestDTO;
import com.dineevents.client.DTO.Response.ClientResponseDTO;
import com.dineevents.client.Entity.Client;
import com.dineevents.client.Repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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
        return clientResponseDTO;
    }
}