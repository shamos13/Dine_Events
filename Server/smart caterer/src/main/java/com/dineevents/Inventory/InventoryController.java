package com.dineevents.Inventory;

import com.dineevents.Inventory.DTO.InventoryRequestDTO;
import com.dineevents.Inventory.DTO.InventoryResponseDTO;
import com.dineevents.Inventory.Service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    // Create a new inventory
    @PostMapping("/create")
    public ResponseEntity<InventoryResponseDTO> createInventory(@RequestBody InventoryRequestDTO inventoryRequestDTO){
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createInventory(inventoryRequestDTO));
    }
}
