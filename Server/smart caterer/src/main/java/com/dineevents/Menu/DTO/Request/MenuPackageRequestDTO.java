package com.dineevents.Menu.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuPackageRequestDTO {

    @NotBlank(message = "Package name is required")
    private String packageName;

    private String serviceType;

    @NotNull(message = "Price per pax is required")
    private BigDecimal pricePerPax;

    private Integer minGuests;

    @NotNull(message = "At least one menu item is required")
    private List<Long> menuItemIds;
}