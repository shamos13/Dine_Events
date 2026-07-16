package com.dineevents.Menu.Controller;

import com.dineevents.Menu.DTO.Request.MenuCategoryRequestDto;
import com.dineevents.Menu.DTO.Response.MenuCategoryResponseDto;
import com.dineevents.Menu.service.MenuCategoryService;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@PermitAll
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/menu-category")
public class MenuCategoryController {

    private final MenuCategoryService menuCategoryService;

    //Creating a new menu category
    @PostMapping("/create")
    public ResponseEntity<MenuCategoryResponseDto> createMenuCategory(@RequestBody  MenuCategoryRequestDto menuCategoryRequestDto){
        log.info("Creating a new menu category");
        MenuCategoryResponseDto createdMenuCategory = menuCategoryService.createMenuCategory(menuCategoryRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMenuCategory);
    }
}
