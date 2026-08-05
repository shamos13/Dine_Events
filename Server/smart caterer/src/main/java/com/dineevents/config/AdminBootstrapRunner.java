package com.dineevents.config;

import com.dineevents.auth.Entity.AppUser;
import com.dineevents.auth.Enum.Role;
import com.dineevents.auth.Repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrapRunner implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.email:admin@dineevents.ke}")
    private String adminEmail;

    @Value("${app.bootstrap.admin.password:AdminPass123!}")
    private String adminPassword;

    @Value("${app.bootstrap.admin.full-name:System Admin}")
    private String adminFullName;

    @Override
    public void run(String... args) {
        if (appUserRepository.existsByRole(Role.ADMIN)) {
            return;
        }

        AppUser admin = new AppUser();
        admin.setEmail(adminEmail);
        admin.setFullName(adminFullName);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        appUserRepository.save(admin);
        log.info("Bootstrapped initial ADMIN user: {}", adminEmail);
    }
}
