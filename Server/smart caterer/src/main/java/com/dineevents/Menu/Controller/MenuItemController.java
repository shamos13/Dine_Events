package com.dineevents.Menu.Controller;

import com.dineevents.Menu.DTO.Request.MenuItemRequestDTO;
import com.dineevents.Menu.DTO.Response.MenuItemResponseDTO;
import com.dineevents.Menu.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@Slf4j
@RestController
@RequestMapping("/api/v1/menu-item")
public class MenuItemController {

    private final MenuItemService menuItemService;

    @PostMapping("/create")
    public ResponseEntity<MenuItemResponseDTO> createMenuItem(@RequestBody MenuItemRequestDTO menuItemRequestDTO){

        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.createMenuItem(menuItemRequestDTO));
    }

    @GetMapping("/menu-items")
    public ResponseEntity<List<MenuItemResponseDTO>> getAllMenuItems(){
        List<MenuItemResponseDTO> menuItems = menuItemService.getAllMenuITems();
        return ResponseEntity.ok(menuItems);
    }

    // Update on menu-item that skipped Menu Category Name
    @PutMapping("/update/{menuItemId}")
    public ResponseEntity<MenuItemResponseDTO> updateMenuItem(
            @PathVariable Long menuItemId,
            @RequestBody @Valid MenuItemRequestDTO menuItemRequestDTO){
        MenuItemResponseDTO updatedMenuItem = menuItemService.updateMenuItem(menuItemId, menuItemRequestDTO);
        return ResponseEntity.ok(updatedMenuItem);
    }

}
