package com.dineevents.Menu.Entity;

import com.dineevents.event.Entity.Event;
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
@Table(name = "event_menu_package_selections")
public class EventMenuPackageSelection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long selectionId;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne
    @JoinColumn(name = "menu_package_id", nullable = false)
    private MenuPackage menuPackage;

    // Nullable — falls back to Event.guestCount if not set.
    // Lets breakfast serve 50 while the main buffet serves 200 at the same event.
    private Integer guestCountOverride;
}