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
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long staffId;

    private String staffName;
    private String staffEmail;
    private String staffPhone;
    private double staffSalary;
    private String profileImageUrl;
    private String staffRole;

    @ManyToMany
    @JoinTable(
            name="staff_responsibilities",
            joinColumns = @JoinColumn(name = "staff_id"),
            inverseJoinColumns = @JoinColumn(name = "responsibility_id")
    )
    private Set<Responsibilty> responsibilities = new HashSet<>();
}
