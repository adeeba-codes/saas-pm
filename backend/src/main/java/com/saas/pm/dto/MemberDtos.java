package com.saas.pm.dto;

import java.util.UUID;

import com.saas.pm.entity.User;

public class MemberDtos {

    public record InviteRequest(String email, User.Role role) {}

    // Returned once, right after invite — includes the temp password
    // because there's no email service to send it separately. The
    // admin is expected to share this manually. Flag this to the user
    // clearly in the UI as a known limitation, not a production pattern.
    public record InviteResponse(UUID userId, String email, User.Role role, String temporaryPassword) {}

    public record MemberSummary(UUID id, String email, User.Role role) {}

    public record ChangeRoleRequest(User.Role role) {}
}