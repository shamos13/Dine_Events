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

import java.util.List;

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

    // Get all menu items
    public List<MenuItemResponseDTO> getAllMenuITems() {
        log.info("Retrieving all menu items");
        List<MenuItem> menuItems = menuItemRepository.findAll();
        return menuItems.stream().map(this::toResponseDTO).toList();
    }

    // Update on menu-item that skipped Menu Category Name
    // Get the item to be updated first
    public MenuItemResponseDTO updateMenuItem(Long menuItemId, MenuItemRequestDTO menuItemRequestDTO){
        log.info("Updating menu item: {}", menuItemRequestDTO.getMenuItemName());
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new EntityNotFoundException("Menu Item not found: " + menuItemId));
        // update other fields
        menuItem.setMenuItemName(menuItemRequestDTO.getMenuItemName());
        menuItem.setMenuImageUrl(menuItemRequestDTO.getMenuImageUrl());

        if (menuItemRequestDTO.getMenuCategoryId() != null){
            MenuCategory menuCategory = menuCategoryRepository.findById(menuItemRequestDTO.getMenuCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException("Category not found: " + menuItemRequestDTO.getMenuCategoryId()));
            menuItem.setMenuCategory(menuCategory);
        }

        MenuItem updatedMenuItem = menuItemRepository.save(menuItem);
        return toResponseDTO(updatedMenuItem);
    }

    // To entity (Data From Client)
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

    // To DTO (Data from the Database)
    private MenuItemResponseDTO toResponseDTO(MenuItem menuItem){
        MenuItemResponseDTO dto = new MenuItemResponseDTO();
        dto.setMenuItemId(menuItem.getMenuItemId());
        dto.setMenuItemName(menuItem.getMenuItemName());
        dto.setMenuImageUrl(menuItem.getMenuImageUrl());
        dto.setMenuCategoryName(menuItem.getMenuCategory() != null ? menuItem.getMenuCategory().getMenuCategoryName() : null);
        return dto;
    }
}
