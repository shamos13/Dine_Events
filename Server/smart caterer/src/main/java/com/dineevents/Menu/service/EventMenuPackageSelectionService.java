package com.dineevents.Menu.service;

import com.dineevents.Menu.DTO.Request.EventMenuPackageSelectionRequestDTO;
import com.dineevents.Menu.DTO.Response.EventMenuPackageSelectionResponseDTO;
import com.dineevents.Menu.DTO.Response.MenuItemSummaryDTO;
import com.dineevents.Menu.Entity.EventMenuPackageSelection;
import com.dineevents.Menu.Entity.MenuItem;
import com.dineevents.Menu.Entity.MenuPackage;
import com.dineevents.Menu.Entity.MenuPackageItem;
import com.dineevents.Menu.repository.EventMenuPackageSelectionRepository;
import com.dineevents.Menu.repository.MenuPackageItemRepository;
import com.dineevents.Menu.repository.MenuPackageRepository;
import com.dineevents.event.Entity.Event;
import com.dineevents.event.Enums.EventStatus;
import com.dineevents.event.Repository.EventRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventMenuPackageSelectionService {

    private final EventMenuPackageSelectionRepository selectionRepository;
    private final EventRepository eventRepository;
    private final MenuPackageRepository menuPackageRepository;
    private final MenuPackageItemRepository menuPackageItemRepository;

    @Transactional
    public EventMenuPackageSelectionResponseDTO selectPackageForEvent(EventMenuPackageSelectionRequestDTO dto) {
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + dto.getEventId()));
        assertEventMutable(event);
        MenuPackage menuPackage = menuPackageRepository.findById(dto.getMenuPackageId())
                .orElseThrow(() -> new EntityNotFoundException("Menu package not found: " + dto.getMenuPackageId()));

        EventMenuPackageSelection selection = new EventMenuPackageSelection();
        selection.setEvent(event);
        selection.setMenuPackage(menuPackage);
        selection.setGuestCountOverride(dto.getGuestCountOverride());

        EventMenuPackageSelection saved = selectionRepository.save(selection);
        return toResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<EventMenuPackageSelectionResponseDTO> getSelectionsForEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + eventId));
        return selectionRepository.findByEvent(event).stream().map(this::toResponseDTO).toList();
    }

    public void removeSelection(Long selectionId) {
        EventMenuPackageSelection selection = selectionRepository.findById(selectionId)
                .orElseThrow(() -> new EntityNotFoundException("Event menu package selection not found: " + selectionId));
        assertEventMutable(selection.getEvent());
        selectionRepository.delete(selection);
    }

    private void assertEventMutable(Event event) {
        if (event.getEventStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot modify menu packages for a cancelled event");
        }
    }

    private EventMenuPackageSelectionResponseDTO toResponseDTO(EventMenuPackageSelection selection) {
        MenuPackage menuPackage = selection.getMenuPackage();
        EventMenuPackageSelectionResponseDTO dto = new EventMenuPackageSelectionResponseDTO();
        dto.setSelectionId(selection.getSelectionId());
        dto.setMenuPackageId(menuPackage.getMenuPackageId());
        dto.setEventId(selection.getEvent().getEventId());
        dto.setEventName(selection.getEvent().getEventName());
        dto.setPackageName(menuPackage.getPackageName());
        dto.setServiceType(menuPackage.getServiceType());
        dto.setMinGuests(menuPackage.getMinGuests());
        dto.setPricePerPax(menuPackage.getPricePerPax());
        int guestCount = selection.getGuestCountOverride() != null
                ? selection.getGuestCountOverride()
                : selection.getEvent().getGuestCount();
        dto.setGuestCount(guestCount);
        if (menuPackage.getMenuPackageId() != null) {
            List<MenuPackageItem> packageItems = menuPackageItemRepository
                    .findByMenuPackage_MenuPackageId(menuPackage.getMenuPackageId());
            List<MenuItemSummaryDTO> menuItems = packageItems.stream()
                    .map(MenuPackageItem::getMenuItem)
                    .map(this::toMenuItemSummary)
                    .toList();
            dto.setMenuItems(menuItems);
            dto.setMenuItemNames(menuItems.stream().map(MenuItemSummaryDTO::getMenuItemName).toList());
        }
        return dto;
    }

    private MenuItemSummaryDTO toMenuItemSummary(MenuItem menuItem) {
        MenuItemSummaryDTO summary = new MenuItemSummaryDTO();
        summary.setMenuItemId(menuItem.getMenuItemId());
        summary.setMenuItemName(menuItem.getMenuItemName());
        summary.setMenuImageUrl(menuItem.getMenuImageUrl());
        summary.setMenuCategoryName(
                menuItem.getMenuCategory() != null ? menuItem.getMenuCategory().getMenuCategoryName() : null
        );
        return summary;
    }
}
