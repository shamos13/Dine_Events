package com.dineevents.Menu.Controller;

import com.dineevents.Menu.DTO.Request.MenuPackageRequestDTO;
import com.dineevents.Menu.DTO.Response.MenuPackageResponseDTO;
import com.dineevents.Menu.service.MenuPackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/menu-package")
@RequiredArgsConstructor
public class MenuPackageController {

    private final MenuPackageService menuPackageService;

    @PostMapping("/create")
    public ResponseEntity<MenuPackageResponseDTO> createMenuPackage(@Valid @RequestBody MenuPackageRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuPackageService.createMenuPackage(dto));
    }

    @GetMapping("/all-packages")
    public ResponseEntity<List<MenuPackageResponseDTO>> getAllMenuPackages() {
        return ResponseEntity.ok(menuPackageService.getAllMenuPackages());
    }
}