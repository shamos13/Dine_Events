package com.dineevents.Inventory.Controller;

import com.dineevents.Inventory.DTO.Request.InventoryRequestDTO;
import com.dineevents.Inventory.DTO.Response.InventoryResponseDTO;
import com.dineevents.Inventory.Service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


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

    // Get all inventories
    @GetMapping("/all-inventories")
    public ResponseEntity<List<InventoryResponseDTO>> getAllInventories(){
        return ResponseEntity.status(HttpStatus.OK).body(inventoryService.getAllInventories());
    }
}
