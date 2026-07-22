package com.dineevents.Inventory.Service;


import com.dineevents.Inventory.DTO.Request.InventoryRequestDTO;
import com.dineevents.Inventory.DTO.Response.InventoryResponseDTO;
import com.dineevents.Inventory.Entity.Inventory;
import com.dineevents.Inventory.Repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    // DI for the classes
    private final InventoryRepository inventoryRepository;

    // Create a new inventory
    public InventoryResponseDTO createInventory(InventoryRequestDTO inventoryRequestDTO){
        log.info("Creating a new inventory: {}", inventoryRequestDTO.getInventoryName());
        Inventory inventory = toEntity(inventoryRequestDTO);
        Inventory savedInventory = inventoryRepository.save(inventory);
        return toResponseDTO(savedInventory);
    }

    // Get all inventories
    public List<InventoryResponseDTO> getAllInventories(){
        log.info("Retrieving all inventories");
        List<Inventory> inventories = inventoryRepository.findAll();
        return inventories.stream().map(this::toResponseDTO).toList();
    }


    //Mappers
    // DTO to Entity
    private Inventory toEntity(InventoryRequestDTO dto){
        Inventory inventory = new Inventory();
        inventory.setInventoryName(dto.getInventoryName());
        inventory.setInventoryQuantity(dto.getInventoryQuantity());
        inventory.setUnitPrice(dto.getUnitPrice());
        return inventory;
    }

    // Entity to DTO
    private InventoryResponseDTO toResponseDTO(Inventory inventory){
        InventoryResponseDTO dto = new InventoryResponseDTO();
        dto.setInventoryId(inventory.getInventoryId());
        dto.setInventoryName(inventory.getInventoryName());
        dto.setInventoryQuantity(inventory.getInventoryQuantity());
        dto.setUnitPrice(inventory.getUnitPrice());
        return dto;
    }
}
