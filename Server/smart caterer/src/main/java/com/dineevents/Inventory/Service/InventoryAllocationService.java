package com.dineevents.Inventory.Service;

import com.dineevents.Inventory.DTO.Request.InventoryAllocationRequest;
import com.dineevents.Inventory.DTO.Response.InventoryAllocationResponse;
import com.dineevents.Inventory.Entity.Inventory;
import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.Inventory.Repository.InventoryAllocationRepository;
import com.dineevents.Inventory.Repository.InventoryRepository;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Repository.EventRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryAllocationService {

    private final InventoryAllocationRepository inventoryAllocationRepository;
    private final InventoryRepository inventoryRepository;
    private final EventRepository eventRepository;

    // Create a new inventory allocation
    public InventoryAllocationResponse createInventoryAllocation(InventoryAllocationRequest inventoryAllocationRequest){
        log.info("Creating a new inventory allocation for EventID {}", inventoryAllocationRequest.getEventId());
        InventoryItemAllocation inventoryAllocation = toEntity(inventoryAllocationRequest);
        InventoryItemAllocation savedInventoryAllocation = inventoryAllocationRepository.save(inventoryAllocation);
        return toResponseDTO(savedInventoryAllocation);
    }





    //Mappers
    // DTO to Entity (Data from Client)
    // This class handles all the logic instead of putting it into separate class
    private InventoryItemAllocation toEntity(InventoryAllocationRequest dto){
        log.info("Converting DTO to Entity:");
        // Getting the inventory item from the db
        Inventory inventory = inventoryRepository.findById(dto.getInventoryId())
                .orElseThrow(() -> new EntityNotFoundException("Inventory not found: " + dto.getInventoryId()));

        //Getting the event from the db
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + dto.getEventId()));

        InventoryItemAllocation allocation = new InventoryItemAllocation();
        allocation.setInventory(inventory);
        allocation.setEvent(event);
        allocation.setPricingType(dto.getPricingType());

        switch (dto.getPricingType()){
            case PER_UNIT -> {
                if (dto.getQuantityAllocated() == null ||dto.getQuantityAllocated() <= 0){
                    throw new IllegalArgumentException("Quantity must be greater than 0");
                }

                if (dto.getQuantityAllocated() > inventory.getInventoryQuantity()){
                    throw new IllegalArgumentException("Quantity allocated cannot be greater than the inventory quantity");
                }

                if (dto.getUnitPrice() == null || dto.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0){
                    throw new IllegalArgumentException("Unit price must be greater than 0");
                }
                allocation.setUnitPrice(dto.getUnitPrice());
                allocation.setQuantityAllocated(dto.getQuantityAllocated());
                allocation.setTotalCost(dto.getUnitPrice().multiply(BigDecimal.valueOf(dto.getQuantityAllocated())));
            }

            case FLAT_RATE -> {
                if (dto.getFlatRate() == null || dto.getFlatRate().compareTo(BigDecimal.ZERO ) <= 0){
                    throw new IllegalArgumentException("Flat rate must be greater than 0");
                }

                if (dto.getQuantityAllocated() == null ||dto.getQuantityAllocated() <= 0){
                    throw new IllegalArgumentException("Quantity must be greater than 0");
                }
                if (dto.getQuantityAllocated() > inventory.getInventoryQuantity()){
                    throw new IllegalArgumentException("Quantity allocated cannot be greater than the inventory quantity");
                }
                allocation.setQuantityAllocated(dto.getQuantityAllocated());
                allocation.setFlatRate(dto.getFlatRate());
                allocation.setTotalCost(dto.getFlatRate());
            }
        }
        return allocation;
    }

    // Entity to DTO (Data from the database)
    private InventoryAllocationResponse toResponseDTO (InventoryItemAllocation allocation){

        InventoryAllocationResponse dto = new InventoryAllocationResponse();
        dto.setAllocationId(allocation.getAllocationId());
        dto.setInventoryName(allocation.getInventory().getInventoryName());
        dto.setEventName(allocation.getEvent().getEventName());
        dto.setPricingType(allocation.getPricingType());
        dto.setQuantityAllocated(allocation.getQuantityAllocated());
        dto.setUnitPriceAtAllocation(allocation.getUnitPrice());
        dto.setFlatRate(allocation.getFlatRate());
        dto.setTotalCost(allocation.getTotalCost());
        return dto;

    }

}

