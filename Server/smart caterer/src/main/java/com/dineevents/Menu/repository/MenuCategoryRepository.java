package com.dineevents.Menu.repository;

import com.dineevents.Menu.Entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuCategoryRepository extends JpaRepository<MenuCategory,Long> {
}
