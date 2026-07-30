package com.dineevents.Menu.service;

import com.dineevents.Menu.DTO.Request.MenuPackageRequestDTO;
import com.dineevents.Menu.DTO.Response.MenuPackageResponseDTO;
import com.dineevents.Menu.Entity.MenuItem;
import com.dineevents.Menu.Entity.MenuPackage;
import com.dineevents.Menu.Entity.MenuPackageItem;
import com.dineevents.Menu.repository.MenuItemRepository;
import com.dineevents.Menu.repository.MenuPackageRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuPackageService {

    private final MenuPackageRepository menuPackageRepository;
    private final MenuItemRepository menuItemRepository;

    public MenuPackageResponseDTO createMenuPackage(MenuPackageRequestDTO dto) {
        log.info("Creating menu package: {}", dto.getPackageName());

        MenuPackage menuPackage = new MenuPackage();
        menuPackage.setPackageName(dto.getPackageName());
        menuPackage.setServiceType(dto.getServiceType());
        menuPackage.setPricePerPax(dto.getPricePerPax());
        menuPackage.setMinGuests(dto.getMinGuests());

        List<MenuPackageItem> packageItems = new ArrayList<>();
        for (Long menuItemId : dto.getMenuItemIds()) {
            MenuItem menuItem = menuItemRepository.findById(menuItemId)
                    .orElseThrow(() -> new EntityNotFoundException("Menu item not found: " + menuItemId));
            MenuPackageItem packageItem = new MenuPackageItem();
            packageItem.setMenuPackage(menuPackage);
            packageItem.setMenuItem(menuItem);
            packageItems.add(packageItem);
        }
        menuPackage.setPackageItems(packageItems);

        MenuPackage saved = menuPackageRepository.save(menuPackage);
        return toResponseDTO(saved);
    }

    public List<MenuPackageResponseDTO> getAllMenuPackages() {
        return menuPackageRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    private MenuPackageResponseDTO toResponseDTO(MenuPackage menuPackage) {
        MenuPackageResponseDTO dto = new MenuPackageResponseDTO();
        dto.setMenuPackageId(menuPackage.getMenuPackageId());
        dto.setPackageName(menuPackage.getPackageName());
        dto.setServiceType(menuPackage.getServiceType());
        dto.setPricePerPax(menuPackage.getPricePerPax());
        dto.setMinGuests(menuPackage.getMinGuests());
        if (menuPackage.getPackageItems() != null) {
            dto.setMenuItemNames(menuPackage.getPackageItems().stream()
                    .map(item -> item.getMenuItem().getMenuItemName())
                    .toList());
        }
        return dto;
    }
}