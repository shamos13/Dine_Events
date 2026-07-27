package com.dineevents.staff.Entity;


import com.dineevents.event.Entity.Event;
import com.dineevents.staff.Enum.AssignmentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "staff_assignments")
public class StaffAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long staffAssignmentId;

    @ManyToOne
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    @Enumerated(EnumType.STRING)
    private AssignmentStatus assignmentStatus;
    private String roleForEvent;
}
