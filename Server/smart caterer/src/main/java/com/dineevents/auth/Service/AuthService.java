package com.dineevents.auth.Service;

import com.dineevents.auth.DTO.Request.LoginRequestDTO;
import com.dineevents.auth.DTO.Request.RefreshTokenRequestDTO;
import com.dineevents.auth.DTO.Request.RegisterRequestDTO;
import com.dineevents.auth.DTO.Request.StaffRegisterRequestDTO;
import com.dineevents.auth.DTO.Response.AuthResponseDTO;
import com.dineevents.auth.Entity.AppUser;
import com.dineevents.auth.Enum.Role;
import com.dineevents.auth.Exception.InvalidRefreshTokenException;
import com.dineevents.auth.Repository.AppUserRepository;
import com.dineevents.client.Entity.Client;
import com.dineevents.client.Repository.ClientRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final long refreshExpirationMs;

    public AuthService(
            AppUserRepository appUserRepository,
            ClientRepository clientRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs
    ) {
        this.appUserRepository = appUserRepository;
        this.clientRepository = clientRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO dto) {
        if (appUserRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + dto.getEmail());
        }

        Client client = resolveOrCreateClient(dto);

        AppUser user = new AppUser();
        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        user.setRole(Role.CLIENT);
        user.setEnabled(true);
        user.setClient(client);
        issueRefreshToken(user);

        AppUser saved = appUserRepository.save(user);
        String token = jwtService.generateToken(saved);
        return toResponse(saved, token);
    }

    @Transactional
    public AuthResponseDTO registerStaff(StaffRegisterRequestDTO dto) {
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

    @Transactional
    public void changePassword(AppUser user, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from the current password.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        appUserRepository.save(user);
    }

    @Transactional
    public AuthResponseDTO reissueTokens(AppUser user) {
        issueRefreshToken(user);
        AppUser updated = appUserRepository.save(user);
        return toResponse(updated, jwtService.generateToken(updated));
    }

    private Client resolveOrCreateClient(RegisterRequestDTO dto) {
        List<Client> matches = clientRepository.findByClientEmailIgnoreCase(dto.getEmail());
        if (matches.size() == 1) {
            Client existing = matches.get(0);
            if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
                existing.setClientPhone(dto.getPhone());
            }
            if (dto.getCompanyName() != null && !dto.getCompanyName().isBlank()) {
                existing.setCompanyName(dto.getCompanyName());
            }
            return clientRepository.save(existing);
        }

        String[] nameParts = splitFullName(dto.getFullName());
        Client client = new Client();
        client.setFirstName(nameParts[0]);
        client.setLastName(nameParts[1]);
        client.setClientEmail(dto.getEmail());
        client.setClientPhone(dto.getPhone());
        client.setCompanyName(dto.getCompanyName());
        return clientRepository.save(client);
    }

    private String[] splitFullName(String fullName) {
        String trimmed = fullName == null ? "" : fullName.trim();
        int space = trimmed.indexOf(' ');
        if (space < 0) {
            return new String[]{trimmed, ""};
        }
        return new String[]{trimmed.substring(0, space), trimmed.substring(space + 1).trim()};
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
        dto.setRole(user.getRole());
        if (user.getClient() != null) {
            dto.setClientId(user.getClient().getClientId());
            dto.setBusinessName(user.getClient().getCompanyName());
            dto.setProfileImageUrl(user.getClient().getProfileImageUrl());
        } else {
            dto.setClientId(null);
            dto.setBusinessName(null);
            dto.setProfileImageUrl(null);
        }
        return dto;
    }
}
