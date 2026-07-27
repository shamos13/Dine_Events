package com.dineevents.staff.Repository;

import com.dineevents.staff.Entity.StaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StaffAssignmentRepository extends JpaRepository<StaffAssignment,Long> {
}
