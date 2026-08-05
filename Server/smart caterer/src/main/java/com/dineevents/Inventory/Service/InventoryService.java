package com.dineevents.Inventory.Service;


import com.dineevents.Inventory.DTO.Request.InventoryRequestDTO;
import com.dineevents.Inventory.DTO.Response.InventoryResponseDTO;
import com.dineevents.Inventory.Entity.Inventory;
import com.dineevents.Inventory.Repository.InventoryAllocationRepository;
import com.dineevents.Inventory.Repository.InventoryRepository;
import com.dineevents.event.Enums.EventStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryAllocationRepository inventoryAllocationRepository;

    public InventoryResponseDTO createInventory(InventoryRequestDTO inventoryRequestDTO) {
        log.info("Creating a new inventory: {}", inventoryRequestDTO.getInventoryName());
        Inventory inventory = toEntity(inventoryRequestDTO);
        Inventory savedInventory = inventoryRepository.save(inventory);
        return toResponseDTO(savedInventory);
    }

    public List<InventoryResponseDTO> getAllInventories() {
        log.info("Retrieving all inventories");
        return inventoryRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    private Inventory toEntity(InventoryRequestDTO dto) {
        Inventory inventory = new Inventory();
        inventory.setInventoryName(dto.getInventoryName());
        inventory.setInventoryQuantity(dto.getInventoryQuantity());
        inventory.setUnitPrice(dto.getUnitPrice());
        return inventory;
    }

    private InventoryResponseDTO toResponseDTO(Inventory inventory) {
        InventoryResponseDTO dto = new InventoryResponseDTO();
        dto.setInventoryId(inventory.getInventoryId());
        dto.setInventoryName(inventory.getInventoryName());
        dto.setInventoryQuantity(inventory.getInventoryQuantity());
        Long allocated = inventoryAllocationRepository.sumAllocatedQuantity(
                inventory.getInventoryId(), EventStatus.CANCELLED, null);
        int used = allocated == null ? 0 : allocated.intValue();
        int stock = inventory.getInventoryQuantity() == null ? 0 : inventory.getInventoryQuantity();
        dto.setAvailableQuantity(Math.max(0, stock - used));
        dto.setUnitPrice(inventory.getUnitPrice());
        return dto;
    }
}
