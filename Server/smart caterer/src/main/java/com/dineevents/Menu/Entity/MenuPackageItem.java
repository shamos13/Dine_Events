package com.dineevents.Menu.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "menu_package_items")
public class MenuPackageItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long menuPackageItemId;

    @ManyToOne
    @JoinColumn(name = "menu_package_id", nullable = false)
    private MenuPackage menuPackage;

    @ManyToOne
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;
}