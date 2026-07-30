package com.dineevents.Menu.DTO.Response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class EventMenuPackageSelectionResponseDTO {
    private Long selectionId;
    private String eventName;
    private String packageName;
    private Integer guestCount;
    private BigDecimal pricePerPax;
}