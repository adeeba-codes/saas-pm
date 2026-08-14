package com.saas.pm.controller;

import com.saas.pm.dto.AuthDtos.*;
import com.saas.pm.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // These two endpoints are the ONLY ones that don't require a JWT
    // (see SecurityConfig — they're explicitly whitelisted).
    @PostMapping("/signup")
    public AuthResponse signup(@RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
