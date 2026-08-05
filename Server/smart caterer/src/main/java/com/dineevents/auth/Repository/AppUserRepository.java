package com.dineevents.auth.Repository;

import com.dineevents.auth.Entity.AppUser;
import com.dineevents.auth.Enum.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByEmailIgnoreCase(String email);
    Optional<AppUser> findByRefreshToken(String refreshToken);
    boolean existsByEmail(String email);
    boolean existsByRole(Role role);
}
