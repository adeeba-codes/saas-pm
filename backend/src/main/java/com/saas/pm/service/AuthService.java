package com.saas.pm.service;

import com.saas.pm.dto.AuthDtos.*;
import com.saas.pm.entity.Organization;
import com.saas.pm.entity.User;
import com.saas.pm.repository.OrganizationRepository;
import com.saas.pm.repository.UserRepository;
import com.saas.pm.security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, OrganizationRepository organizationRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.jwtUtil = jwtUtil;
    }

    // Signup flow: create a brand-new tenant (Organization) and its
    // first user as ADMIN. Every subsequent user who joins this org
    // (via an invite flow you'd build later) gets MEMBER or VIEWER.
    public AuthResponse signup(SignupRequest req) {
        if (userRepository.findByEmail(req.email()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        Organization org = new Organization();
        org.setName(req.organizationName());
        org = organizationRepository.save(org);

        User user = new User();
        user.setEmail(req.email());
        user.setPasswordHash(encoder.encode(req.password()));
        user.setOrganization(org);
        user.setRole(User.Role.ADMIN); // first user in an org is always admin
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), org.getId(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name(), org.getName());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new SecurityException("Invalid credentials"));

        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new SecurityException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getOrganization().getId(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name(), user.getOrganization().getName());
    }
}
