package com.dineevents.Menu.DTO.Response;

import lombok.Data;

@Data
public class MenuItemResponseDTO {
    private Long menuItemId;
    private String menuItemName;
    private String menuImageUrl;
    private String menuCategoryName;
}
