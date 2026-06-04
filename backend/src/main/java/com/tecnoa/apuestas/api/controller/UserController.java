package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.api.dto.request.UpdateUserRequest;
import com.tecnoa.apuestas.api.dto.response.AuthResponse;
import com.tecnoa.apuestas.domain.service.UserService;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserResponse> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getProfile(principal));
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponse.UserResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateProfile(principal, request));
    }

    @PostMapping("/me/verify-email")
    public ResponseEntity<Void> sendVerificationEmail(@AuthenticationPrincipal UserPrincipal principal) {
        userService.sendVerificationEmail(principal);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/verify-email/{token}")
    public ResponseEntity<String> confirmEmail(@PathVariable String token) {
        String result = userService.confirmVerification(token);
        return ResponseEntity.ok(result.equals("verified")
                ? "✅ Correo verificado correctamente. Puedes volver a la app."
                : "Ya estaba verificado.");
    }
}
