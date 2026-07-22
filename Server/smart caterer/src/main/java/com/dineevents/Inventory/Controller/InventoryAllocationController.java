package com.dineevents.Inventory.Controller;


import com.dineevents.Inventory.DTO.Request.InventoryAllocationRequest;
import com.dineevents.Inventory.DTO.Response.InventoryAllocationResponse;
import com.dineevents.Inventory.Service.InventoryAllocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory-allocation")
@RequiredArgsConstructor
public class InventoryAllocationController {

    private final InventoryAllocationService inventoryAllocationService;


    // Create a new inventory allocation
    @PostMapping("/create")
    public ResponseEntity<InventoryAllocationResponse> createInventoryAllocation(@Valid @RequestBody InventoryAllocationRequest inventoryAllocationRequest){
        return ResponseEntity.status(201).body(inventoryAllocationService.createInventoryAllocation(inventoryAllocationRequest));
    }

    @GetMapping("/all-allocations")
    public ResponseEntity<List<InventoryAllocationResponse>> getAllInventoryAllocations(){
        return ResponseEntity.status(200).body(inventoryAllocationService.getAllInventoryAllocations());
    }
}
