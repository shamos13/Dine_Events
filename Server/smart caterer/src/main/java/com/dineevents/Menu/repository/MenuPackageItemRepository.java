package com.dineevents.Menu.repository;

import com.dineevents.Menu.Entity.MenuPackageItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuPackageItemRepository extends JpaRepository<MenuPackageItem, Long> {
    List<MenuPackageItem> findByMenuPackage_MenuPackageId(Long menuPackageId);
}