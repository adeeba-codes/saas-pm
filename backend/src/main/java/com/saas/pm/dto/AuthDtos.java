package com.saas.pm.dto;

public class AuthDtos {

    // Signup creates BOTH a new organization AND its first admin user.
    public record SignupRequest(String organizationName, String email, String password) {}

    public record LoginRequest(String email, String password) {}

    public record AuthResponse(String token, String role, String organizationName) {}
}
