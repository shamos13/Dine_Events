package com.dineevents.auth.Service;

import com.dineevents.auth.DTO.Request.LoginRequestDTO;
import com.dineevents.auth.DTO.Request.RegisterRequestDTO;
import com.dineevents.auth.DTO.Response.AuthResponseDTO;
import com.dineevents.auth.Entity.AppUser;
import com.dineevents.auth.Enum.Role;
import com.dineevents.auth.Repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponseDTO register(RegisterRequestDTO dto) {
        if (appUserRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + dto.getEmail());
        }

        AppUser user = new AppUser();
        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        user.setRole(Role.ADMIN);
        user.setEnabled(true);

        AppUser saved = appUserRepository.save(user);
        String token = jwtService.generateToken(saved);
        return toResponse(saved, token);
    }

    public AuthResponseDTO login(LoginRequestDTO dto) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
        );

        AppUser user = appUserRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found after authentication: " + dto.getEmail()));

        String token = jwtService.generateToken(user);
        return toResponse(user, token);
    }

    private AuthResponseDTO toResponse(AppUser user, String token) {
        AuthResponseDTO dto = new AuthResponseDTO();
        dto.setToken(token);
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        return dto;
    }
}