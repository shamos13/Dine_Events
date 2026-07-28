package com.dineevents.auth.DTO.Response;

import com.dineevents.auth.Enum.Role;
import lombok.Data;

@Data
public class AuthResponseDTO {
    private String token;
    private String email;
    private String fullName;

    private Role role;
}