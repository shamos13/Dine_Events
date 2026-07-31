package com.dineevents.Menu.DTO.Response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class EventMenuPackageSelectionResponseDTO {
    private Long selectionId;
    private Long menuPackageId;
    private Long eventId;
    private String eventName;
    private String packageName;
    private String serviceType;
    private Integer minGuests;
    private Integer guestCount;
    private BigDecimal pricePerPax;
    private java.util.List<String> menuItemNames;
}
