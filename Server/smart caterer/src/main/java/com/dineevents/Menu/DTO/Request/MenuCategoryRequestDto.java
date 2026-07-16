package com.dineevents.Menu.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class MenuCategoryRequestDto {

    @NotBlank(message = "Menu Category Name is required")
    private String menuCategoryName;
    private String menuCategoryDescription;
    private int displayOrder;
}
