package com.dineevents.staff.Repository;

import com.dineevents.staff.Entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffRepository extends JpaRepository<Staff, Long> {
}
