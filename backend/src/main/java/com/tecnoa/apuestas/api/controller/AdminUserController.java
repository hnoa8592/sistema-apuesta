package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.domain.model.User;
import com.tecnoa.apuestas.domain.model.enums.UserRole;
import com.tecnoa.apuestas.domain.repository.UserRepository;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "Admin - Users")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public record UpdateRoleRequest(String role) {}

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users.stream().map(this::toMap).toList());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<Map<String, Object>> updateRole(@PathVariable UUID id,
                                                          @RequestBody UpdateRoleRequest req,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        if (!principal.isAdmin()) return ResponseEntity.status(403).build();
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(UserRole.valueOf(req.role()));
        userRepository.save(user);
        return ResponseEntity.ok(toMap(user));
    }

    private Map<String, Object> toMap(User u) {
        return Map.of(
                "id", u.getId().toString(),
                "name", u.getName() != null ? u.getName() : "",
                "email", u.getEmail() != null ? u.getEmail() : "",
                "role", u.getRole().name(),
                "emailVerified", u.isEmailVerified(),
                "createdAt", u.getCreatedAt().toString()
        );
    }
}