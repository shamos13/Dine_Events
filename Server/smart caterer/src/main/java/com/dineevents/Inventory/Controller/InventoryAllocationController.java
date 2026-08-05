package com.dineevents.Inventory.Controller;


import com.dineevents.Inventory.DTO.Request.InventoryAllocationRequest;
import com.dineevents.Inventory.DTO.Request.InventoryAllocationUpdateRequest;
import com.dineevents.Inventory.DTO.Response.InventoryAllocationResponse;
import com.dineevents.Inventory.Service.InventoryAllocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/v1/inventory-allocation")
@RequiredArgsConstructor
public class InventoryAllocationController {

    private final InventoryAllocationService inventoryAllocationService;

    @PostMapping("/create")
    public ResponseEntity<InventoryAllocationResponse> createInventoryAllocation(
            @Valid @RequestBody InventoryAllocationRequest inventoryAllocationRequest) {
        return ResponseEntity.status(201).body(inventoryAllocationService.createInventoryAllocation(inventoryAllocationRequest));
    }

    @GetMapping("/all-allocations")
    public ResponseEntity<List<InventoryAllocationResponse>> getAllInventoryAllocations() {
        return ResponseEntity.status(200).body(inventoryAllocationService.getAllInventoryAllocations());
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<InventoryAllocationResponse>> getInventoryAllocationsByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(inventoryAllocationService.getInventoryAllocationsByEventId(eventId));
    }

    @PatchMapping("/{allocationId}")
    public ResponseEntity<InventoryAllocationResponse> updateInventoryAllocation(
            @PathVariable Long allocationId,
            @Valid @RequestBody InventoryAllocationUpdateRequest request) {
        return ResponseEntity.ok(inventoryAllocationService.updateInventoryAllocation(allocationId, request));
    }

    @DeleteMapping("/{allocationId}")
    public ResponseEntity<Void> deleteInventoryAllocation(@PathVariable Long allocationId) {
        inventoryAllocationService.deleteInventoryAllocation(allocationId);
        return ResponseEntity.noContent().build();
    }
}
