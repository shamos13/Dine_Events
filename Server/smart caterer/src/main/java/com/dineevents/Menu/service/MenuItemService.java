package com.dineevents.Menu.service;

import com.dineevents.Menu.DTO.Request.MenuItemRequestDTO;
import com.dineevents.Menu.DTO.Response.MenuItemResponseDTO;
import com.dineevents.Menu.Entity.MenuCategory;
import com.dineevents.Menu.Entity.MenuItem;
import com.dineevents.Menu.repository.MenuCategoryRepository;
import com.dineevents.Menu.repository.MenuItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@RequiredArgsConstructor
@Service
public class MenuItemService {
    private final MenuItemRepository menuItemRepository;
    private final MenuCategoryRepository menuCategoryRepository;

    // Create a new menu item
    public MenuItemResponseDTO createMenuItem(MenuItemRequestDTO menuItemRequestDTO) {
        log.info("Creating menu item: {}", menuItemRequestDTO.getMenuItemName());

        // Convert DTO to entity
        MenuItem menuItem = toEntity(menuItemRequestDTO);
        //Save to Db
        MenuItem savedMenuItem = menuItemRepository.save(menuItem);

        return toResponseDTO(savedMenuItem);


    }

    private MenuItem toEntity(MenuItemRequestDTO dto){
        MenuItem menuItem = new MenuItem();
        menuItem.setMenuItemName(dto.getMenuItemName());
        menuItem.setMenuImageUrl(dto.getMenuImageUrl());
        if (dto.getMenuCategoryId() != null){
            MenuCategory menuCategory = menuCategoryRepository.findById(dto.getMenuCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException("Category not found: " + dto.getMenuCategoryId()));
            menuItem.setMenuCategory(menuCategory);
        }
        return menuItem;
    }

    private MenuItemResponseDTO toResponseDTO(MenuItem menuItem){
        MenuItemResponseDTO dto = new MenuItemResponseDTO();
        dto.setMenuItemId(menuItem.getMenuItemId());
        dto.setMenuItemName(menuItem.getMenuItemName());
        dto.setMenuImageUrl(menuItem.getMenuImageUrl());
        dto.setMenuCategoryName(menuItem.getMenuCategory() != null ? menuItem.getMenuCategory().getMenuCategoryName() : null);
        return dto;
    }
}
