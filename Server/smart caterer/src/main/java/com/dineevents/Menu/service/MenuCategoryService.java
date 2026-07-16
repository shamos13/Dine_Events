package com.dineevents.Menu.service;

import com.dineevents.Menu.DTO.Request.MenuCategoryRequestDto;
import com.dineevents.Menu.DTO.Response.MenuCategoryResponseDto;
import com.dineevents.Menu.Entity.MenuCategory;
import com.dineevents.Menu.repository.MenuCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MenuCategoryService {

    private final MenuCategoryRepository menuCategoryRepository;

    //Create a new menu category
    public MenuCategoryResponseDto createMenuCategory(MenuCategoryRequestDto menuCategoryRequestDto) {
        MenuCategory menuCategory = toEntity(menuCategoryRequestDto);
        MenuCategory savedMenuCategory = menuCategoryRepository.save(menuCategory);
        return toResponseDto(savedMenuCategory);
    }


    private MenuCategory toEntity(MenuCategoryRequestDto dto) {
        MenuCategory menuCategory = new MenuCategory();
        menuCategory.setMenuCategoryName(dto.getMenuCategoryName());
        menuCategory.setMenuCategoryDescription(dto.getMenuCategoryDescription());
        menuCategory.setDisplayOrder(dto.getDisplayOrder());
        return menuCategory;
    }

    private MenuCategoryResponseDto toResponseDto(MenuCategory menuCategory) {
        MenuCategoryResponseDto dto = new MenuCategoryResponseDto();
        dto.setMenuCategoryId(menuCategory.getMenuCategoryId());
        dto.setMenuCategoryName(menuCategory.getMenuCategoryName());
        dto.setMenuCategoryDescription(menuCategory.getMenuCategoryDescription());
        dto.setDisplayOrder(menuCategory.getDisplayOrder());
        return dto;
    }
}


