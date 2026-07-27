package com.dineevents.staff.Repository;

import com.dineevents.event.Entity.Event;
import com.dineevents.staff.Entity.StaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffAssignmentRepository extends JpaRepository<StaffAssignment,Long> {

    List<StaffAssignment> findByEvent(Event event);
}
