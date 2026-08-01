package com.dineevents.Menu.Controller;

import com.dineevents.Menu.DTO.Request.MenuCategoryRequestDto;
import com.dineevents.Menu.DTO.Response.MenuCategoryResponseDto;
import com.dineevents.Menu.service.MenuCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/v1/menu-category")
public class MenuCategoryController {

    private final MenuCategoryService menuCategoryService;

    @PostMapping("/create")
    public ResponseEntity<MenuCategoryResponseDto> createMenuCategory(@RequestBody MenuCategoryRequestDto menuCategoryRequestDto) {
        log.info("Creating a new menu category");
        MenuCategoryResponseDto createdMenuCategory = menuCategoryService.createMenuCategory(menuCategoryRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMenuCategory);
    }

    @GetMapping("/all")
    public ResponseEntity<List<MenuCategoryResponseDto>> getAllCategories() {
        return ResponseEntity.ok(menuCategoryService.getAllCategories());
    }
}
