package com.dineevents.staff.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

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

    @ElementCollection
    @CollectionTable(joinColumns = @JoinColumn(name = "staff_id"))
    @Column(name = "responsibility")
    private List<String> responsibilities = new ArrayList<>();
}
