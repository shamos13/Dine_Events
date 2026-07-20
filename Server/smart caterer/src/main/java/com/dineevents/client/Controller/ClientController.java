package com.dineevents.client.Controller;

import com.dineevents.client.DTO.Request.ClientRequestDTO;
import com.dineevents.client.DTO.Response.ClientResponseDTO;
import com.dineevents.client.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/client")
public class ClientController {

    private final ClientService clientService;


    @PostMapping("/save-client")
    public ResponseEntity<ClientResponseDTO> saveClient(@RequestBody @Valid ClientRequestDTO dto){
        return ResponseEntity.ok(clientService.createClient(dto));
    }

    @GetMapping("/all-clients")
    public ResponseEntity<List<ClientResponseDTO>> getAllClients(){
        return ResponseEntity.ok(clientService.getAllClients());
    }
}
