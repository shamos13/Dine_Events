package com.dineevents.auth.Service;

import com.dineevents.auth.DTO.Request.LoginRequestDTO;
import com.dineevents.auth.DTO.Request.RefreshTokenRequestDTO;
import com.dineevents.auth.DTO.Request.RegisterRequestDTO;
import com.dineevents.auth.DTO.Response.AuthResponseDTO;
import com.dineevents.auth.Entity.AppUser;
import com.dineevents.auth.Enum.Role;
import com.dineevents.auth.Exception.InvalidRefreshTokenException;
import com.dineevents.auth.Repository.AppUserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

@Slf4j
@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final long refreshExpirationMs;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.refreshExpirationMs = refreshExpirationMs;
    }

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
        issueRefreshToken(user);

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

        issueRefreshToken(user);
        AppUser updated = appUserRepository.save(user);

        String token = jwtService.generateToken(updated);
        return toResponse(updated, token);
    }

    public AuthResponseDTO refreshToken(RefreshTokenRequestDTO dto) {
        String refreshToken = dto.getRefreshToken();
        AppUser user = appUserRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token is invalid."));

        if (user.getRefreshTokenExpiresAt() == null || user.getRefreshTokenExpiresAt().before(new Date())) {
            throw new InvalidRefreshTokenException("Refresh token has expired.");
        }

        issueRefreshToken(user);
        AppUser updated = appUserRepository.save(user);

        String token = jwtService.generateToken(updated);
        return toResponse(updated, token);
    }

    private void issueRefreshToken(AppUser user) {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        String refreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        user.setRefreshToken(refreshToken);
        user.setRefreshTokenExpiresAt(new Date(System.currentTimeMillis() + refreshExpirationMs));
    }

    private AuthResponseDTO toResponse(AppUser user, String token) {
        AuthResponseDTO dto = new AuthResponseDTO();
        dto.setToken(token);
        dto.setRefreshToken(user.getRefreshToken());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setBusinessName(null);
        dto.setRole(user.getRole());
        return dto;
    }
}
