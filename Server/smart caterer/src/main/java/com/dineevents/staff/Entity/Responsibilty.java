package com.dineevents.staff.Entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Responsibilty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long responsibiltyId;
    private String responsibiltyName;

    @ManyToMany(mappedBy = "responsibilities")
    private Set<Staff> staffs = new HashSet<>();
}
