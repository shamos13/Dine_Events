package com.dineevents.Menu.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemRequestDTO {

    @NotBlank(message = "Menu Item Name is required")
    private String menuItemName;
    private String menuImageUrl;
    private Long menuCategoryId;


}
