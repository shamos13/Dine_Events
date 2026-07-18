package com.dineevents.client.Controller;

import com.dineevents.client.DTO.Request.ClientRequestDTO;
import com.dineevents.client.DTO.Response.ClientResponseDTO;
import com.dineevents.client.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/client")
public class ClientController {

    private final ClientService clientService;


    @PostMapping("/save-client")
    public ResponseEntity<ClientResponseDTO> saveClient(@RequestBody @Valid ClientRequestDTO dto){
        return ResponseEntity.ok(clientService.createClient(dto));

    }
}
