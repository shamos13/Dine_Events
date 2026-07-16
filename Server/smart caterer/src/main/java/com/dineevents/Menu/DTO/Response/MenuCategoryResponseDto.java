package com.dineevents.Menu.DTO.Response;

import lombok.Data;

@Data
public class MenuCategoryResponseDto {
    private Long menuCategoryId;
    private String menuCategoryName;
    private String menuCategoryDescription;
    private int displayOrder;
}
