package com.dineevents.common;

import com.dineevents.auth.Entity.AppUser;
import com.dineevents.auth.Repository.AppUserRepository;
import com.dineevents.client.Entity.Client;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final AppUserRepository appUserRepository;

    public AppUser requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("Not authenticated");
        }

        String email = authentication.getName();
        return appUserRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    }

    public Client requireCurrentClient() {
        AppUser user = requireCurrentUser();
        if (user.getClient() == null) {
            throw new AccessDeniedException("Current user is not linked to a client profile");
        }
        return user.getClient();
    }

    public Long requireCurrentClientId() {
        return requireCurrentClient().getClientId();
    }
}
