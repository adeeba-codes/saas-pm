package com.saas.pm.service;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.saas.pm.dto.MemberDtos.*;
import com.saas.pm.dto.MemberDtos.InviteRequest;
import com.saas.pm.dto.MemberDtos.InviteResponse;
import com.saas.pm.dto.MemberDtos.MemberSummary;
import com.saas.pm.entity.Organization;
import com.saas.pm.entity.User;
import com.saas.pm.repository.OrganizationRepository;
import com.saas.pm.repository.UserRepository;
import com.saas.pm.security.TenantContext;

@Service
public class MemberService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private static final String PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private final SecureRandom random = new SecureRandom();

    public MemberService(UserRepository userRepository, OrganizationRepository organizationRepository) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
    }

    // Only an ADMIN can invite. This check is duplicated in the
    // controller layer intentionally isn't — this service is the
    // single source of truth for the rule, so there's only one place
    // to get it right.
    private void requireAdmin() {
        if (!"ADMIN".equals(TenantContext.getRole())) {
            throw new SecurityException("Only admins can manage team members");
        }
    }

    public InviteResponse invite(InviteRequest req) {
        requireAdmin();
        UUID orgId = TenantContext.getOrgId();

        if (userRepository.findByEmail(req.email()).isPresent()) {
            throw new IllegalArgumentException("A user with this email already exists");
        }

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalStateException("Organization not found"));

        String tempPassword = generateTempPassword();

        User user = new User();
        user.setEmail(req.email());
        user.setPasswordHash(encoder.encode(tempPassword));
        user.setOrganization(org);
        // Default new invites to MEMBER unless the admin explicitly
        // requests VIEWER — deliberately never allow inviting as ADMIN
        // here, to avoid privilege escalation via a careless request body.
        user.setRole(req.role() == User.Role.VIEWER ? User.Role.VIEWER : User.Role.MEMBER);
        user = userRepository.save(user);

        return new InviteResponse(user.getId(), user.getEmail(), user.getRole(), tempPassword);
    }

    public List<MemberSummary> listMembers() {
        UUID orgId = TenantContext.getOrgId();
        return userRepository.findByOrganizationId(orgId).stream()
                .map(u -> new MemberSummary(u.getId(), u.getEmail(), u.getRole()))
                .toList();
    }

    public MemberSummary changeRole(UUID userId, User.Role newRole) {
        requireAdmin();
        UUID orgId = TenantContext.getOrgId();

        User user = userRepository.findByOrganizationId(orgId).stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new SecurityException("User not found or not in your organization"));

        if (user.getId().equals(TenantContext.getUserId())) {
            throw new IllegalArgumentException("You cannot change your own role");
        }

        user.setRole(newRole);
        user = userRepository.save(user);
        return new MemberSummary(user.getId(), user.getEmail(), user.getRole());
    }

    public void removeMember(UUID userId) {
        requireAdmin();
        UUID orgId = TenantContext.getOrgId();

        if (userId.equals(TenantContext.getUserId())) {
            throw new IllegalArgumentException("You cannot remove yourself");
        }

        User user = userRepository.findByOrganizationId(orgId).stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new SecurityException("User not found or not in your organization"));

        userRepository.delete(user);
    }

    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(PASSWORD_CHARS.charAt(random.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}