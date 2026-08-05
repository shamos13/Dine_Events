package com.dineevents.Inventory.Service;

import com.dineevents.Inventory.DTO.Request.InventoryAllocationRequest;
import com.dineevents.Inventory.DTO.Request.InventoryAllocationUpdateRequest;
import com.dineevents.Inventory.DTO.Response.InventoryAllocationResponse;
import com.dineevents.Inventory.Entity.Inventory;
import com.dineevents.Inventory.Entity.InventoryItemAllocation;
import com.dineevents.Inventory.Repository.InventoryAllocationRepository;
import com.dineevents.Inventory.Repository.InventoryRepository;
import com.dineevents.Quotation.Entity.QuotationLineItem;
import com.dineevents.Quotation.Repository.QuotationLineItemRepository;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryAllocationService {

    private final InventoryAllocationRepository inventoryAllocationRepository;
    private final InventoryRepository inventoryRepository;
    private final EventRepository eventRepository;
    private final QuotationLineItemRepository quotationLineItemRepository;

    @Transactional
    public InventoryAllocationResponse createInventoryAllocation(InventoryAllocationRequest inventoryAllocationRequest) {
        log.info("Creating a new inventory allocation for EventID {}", inventoryAllocationRequest.getEventId());
        InventoryItemAllocation inventoryAllocation = toEntity(inventoryAllocationRequest, null);
        InventoryItemAllocation savedInventoryAllocation = inventoryAllocationRepository.save(inventoryAllocation);
        return toResponseDTO(savedInventoryAllocation);
    }

    public List<InventoryAllocationResponse> getAllInventoryAllocations() {
        log.info("Retrieving all inventory allocations");
        return inventoryAllocationRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    public List<InventoryAllocationResponse> getInventoryAllocationsByEventId(Long eventId) {
        log.info("Retrieving inventory allocations for EventID {}", eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + eventId));
        return inventoryAllocationRepository.findByEvent(event).stream().map(this::toResponseDTO).toList();
    }

    @Transactional
    public InventoryAllocationResponse updateInventoryAllocation(Long allocationId, InventoryAllocationUpdateRequest request) {
        InventoryItemAllocation allocation = inventoryAllocationRepository.findById(allocationId)
                .orElseThrow(() -> new EntityNotFoundException("Allocation not found: " + allocationId));

        if (allocation.getEvent().getEventStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update inventory allocation for a cancelled event");
        }

        applyPricing(allocation, allocation.getInventory(), request.getPricingType(),
                request.getQuantityAllocated(), request.getFlatRate(), allocationId);

        return toResponseDTO(inventoryAllocationRepository.save(allocation));
    }

    @Transactional
    public void deleteInventoryAllocation(Long allocationId) {
        InventoryItemAllocation allocation = inventoryAllocationRepository.findById(allocationId)
                .orElseThrow(() -> new EntityNotFoundException("Allocation not found: " + allocationId));

        if (allocation.getEvent().getEventStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot delete inventory allocation for a cancelled event");
        }

        List<QuotationLineItem> linkedItems = quotationLineItemRepository.findByInventoryItemAllocation(allocation);
        for (QuotationLineItem item : linkedItems) {
            item.setInventoryItemAllocation(null);
        }
        if (!linkedItems.isEmpty()) {
            quotationLineItemRepository.saveAll(linkedItems);
        }

        inventoryAllocationRepository.delete(allocation);
        log.info("Deleted inventory allocation {}", allocationId);
    }

    private InventoryItemAllocation toEntity(InventoryAllocationRequest dto, Long excludeAllocationId) {
        Inventory inventory = inventoryRepository.findById(dto.getInventoryId())
                .orElseThrow(() -> new EntityNotFoundException("Inventory not found: " + dto.getInventoryId()));

        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + dto.getEventId()));

        if (event.getEventStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot allocate inventory for a cancelled event");
        }

        InventoryItemAllocation allocation = new InventoryItemAllocation();
        allocation.setInventory(inventory);
        allocation.setEvent(event);
        applyPricing(allocation, inventory, dto.getPricingType(), dto.getQuantityAllocated(), dto.getFlatRate(), excludeAllocationId);
        return allocation;
    }

    private void applyPricing(
            InventoryItemAllocation allocation,
            Inventory inventory,
            com.dineevents.Inventory.Enums.PricingType pricingType,
            Integer quantityAllocated,
            BigDecimal flatRate,
            Long excludeAllocationId
    ) {
        allocation.setPricingType(pricingType);

        if (quantityAllocated == null || quantityAllocated <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        int available = availableQuantity(inventory.getInventoryId(), inventory.getInventoryQuantity(), excludeAllocationId);
        if (quantityAllocated > available) {
            throw new IllegalArgumentException(
                    "Quantity allocated (" + quantityAllocated + ") exceeds available stock (" + available + ")");
        }

        switch (pricingType) {
            case PER_UNIT -> {
                BigDecimal catalogPrice = inventory.getUnitPrice();
                allocation.setUnitPrice(catalogPrice);
                allocation.setQuantityAllocated(quantityAllocated);
                allocation.setFlatRate(null);
                allocation.setTotalCost(catalogPrice.multiply(BigDecimal.valueOf(quantityAllocated)));
            }
            case FLAT_RATE -> {
                if (flatRate == null || flatRate.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Flat rate must be greater than 0");
                }
                allocation.setQuantityAllocated(quantityAllocated);
                allocation.setFlatRate(flatRate);
                allocation.setUnitPrice(null);
                allocation.setTotalCost(flatRate);
            }
        }
    }

    int availableQuantity(Long inventoryId, Integer catalogQuantity, Long excludeAllocationId) {
        Long allocated = inventoryAllocationRepository.sumAllocatedQuantity(
                inventoryId, EventStatus.CANCELLED, excludeAllocationId);
        int used = allocated == null ? 0 : allocated.intValue();
        return Math.max(0, (catalogQuantity == null ? 0 : catalogQuantity) - used);
    }

    private InventoryAllocationResponse toResponseDTO(InventoryItemAllocation allocation) {
        InventoryAllocationResponse dto = new InventoryAllocationResponse();
        dto.setAllocationId(allocation.getAllocationId());
        dto.setEventId(allocation.getEvent().getEventId());
        dto.setInventoryId(allocation.getInventory().getInventoryId());
        dto.setInventoryName(allocation.getInventory().getInventoryName());
        dto.setEventName(allocation.getEvent().getEventName());
        if (allocation.getEvent().getClient() != null) {
            dto.setClientName(allocation.getEvent().getClient().getFirstName() + " "
                    + allocation.getEvent().getClient().getLastName());
        }
        dto.setPricingType(allocation.getPricingType());
        dto.setQuantityAllocated(allocation.getQuantityAllocated());
        dto.setUnitPriceAtAllocation(allocation.getUnitPrice());
        dto.setFlatRate(allocation.getFlatRate());
        dto.setTotalCost(allocation.getTotalCost());
        dto.setAvailableQuantity(availableQuantity(
                allocation.getInventory().getInventoryId(),
                allocation.getInventory().getInventoryQuantity(),
                allocation.getAllocationId()));
        return dto;
    }
}
