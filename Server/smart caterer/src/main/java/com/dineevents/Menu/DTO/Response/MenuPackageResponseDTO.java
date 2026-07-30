package com.dineevents.Menu.DTO.Response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class MenuPackageResponseDTO {
    private Long menuPackageId;
    private String packageName;
    private String serviceType;
    private BigDecimal pricePerPax;
    private Integer minGuests;
    private List<String> menuItemNames;
}