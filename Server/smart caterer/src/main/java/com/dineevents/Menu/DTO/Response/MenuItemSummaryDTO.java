package com.dineevents.Menu.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemSummaryDTO {
    private Long menuItemId;
    private String menuItemName;
    private String menuImageUrl;
    private String menuCategoryName;
}
