package com.dineevents.Menu.Controller;

import com.dineevents.Menu.DTO.Request.MenuItemRequestDTO;
import com.dineevents.Menu.DTO.Response.MenuItemResponseDTO;
import com.dineevents.Menu.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@Slf4j
@RestController
@RequestMapping("/api/v1/menu-item")
public class MenuItemController {

    private final MenuItemService menuItemService;

    @PostMapping("/create")
    public ResponseEntity<MenuItemResponseDTO> createMenuItem(@RequestBody MenuItemRequestDTO menuItemRequestDTO){
        log.info("Creating a menu item");
        MenuItemResponseDTO createdMenuItem = menuItemService.createMenuItem(menuItemRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMenuItem);
    }

}
