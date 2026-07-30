package com.dineevents.Menu.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "menu_packages")
public class MenuPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long menuPackageId;

    private String packageName;      // "Breakfast Package", "Standard Buffet"
    private String serviceType;      // buffet / plated / self-service

    @Column(nullable = false)
    private BigDecimal pricePerPax;

    private Integer minGuests;

    @OneToMany(mappedBy = "menuPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MenuPackageItem> packageItems;
}