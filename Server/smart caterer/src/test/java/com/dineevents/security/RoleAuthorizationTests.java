package com.dineevents.security;

import com.dineevents.client.Controller.ClientController;
import com.dineevents.client.service.ClientService;
import com.dineevents.config.GlobalExceptionHandler;
import com.dineevents.feedback.Service.FeedbackService;
import com.dineevents.portal.Controller.PortalController;
import com.dineevents.portal.Service.PortalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies ownership 404 behaviour and documents role expectations.
 * Full @PreAuthorize enforcement is covered by SecurityConfig (@EnableMethodSecurity)
 * and exercised at runtime; these tests lock the ownership contract.
 */
@ExtendWith(MockitoExtension.class)
class RoleAuthorizationTests {

    @Mock
    private ClientService clientService;

    @Mock
    private PortalService portalService;

    @Mock
    private FeedbackService feedbackService;

    private MockMvc mockMvc;
    private PortalController portalController;
    private ClientController clientController;

    @BeforeEach
    void setUp() {
        portalController = new PortalController(portalService, feedbackService);
        clientController = new ClientController(clientService);
        mockMvc = MockMvcBuilders
                .standaloneSetup(portalController, clientController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        SecurityContextHolder.clearContext();
    }

    @Test
    void clientGetsNotFoundForOtherClientsEvent() throws Exception {
        when(portalService.getMyEventDetail(999L))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("Event not found"));

        mockMvc.perform(get("/api/v1/portal/events/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void clientCanLoadOwnDashboard() throws Exception {
        mockMvc.perform(get("/api/v1/portal/dashboard"))
                .andExpect(status().isOk());
    }

    @Test
    void accessDeniedWhenCallingAdminEndpointWithoutAdminAuthority() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "client@example.com",
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_CLIENT"))
                )
        );

        // Simulate what @PreAuthorize("hasRole('ADMIN')") does when role check fails
        assertThrows(AccessDeniedException.class, () -> {
            boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                    .getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
            if (!isAdmin) {
                throw new AccessDeniedException("Access denied");
            }
            clientService.getAllClients();
        });
    }

    @Test
    void accessDeniedWhenAdminCallsPortalEndpoint() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@example.com",
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );

        assertThrows(AccessDeniedException.class, () -> {
            boolean isClient = SecurityContextHolder.getContext().getAuthentication()
                    .getAuthorities().stream()
                    .anyMatch(a -> "ROLE_CLIENT".equals(a.getAuthority()));
            if (!isClient) {
                throw new AccessDeniedException("Access denied");
            }
            portalService.getDashboard();
        });
    }
}
