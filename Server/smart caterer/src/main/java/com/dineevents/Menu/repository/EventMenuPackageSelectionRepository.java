package com.dineevents.Menu.repository;

import com.dineevents.Menu.Entity.EventMenuPackageSelection;
import com.dineevents.event.Entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventMenuPackageSelectionRepository extends JpaRepository<EventMenuPackageSelection, Long> {
    List<EventMenuPackageSelection> findByEvent(Event event);
}