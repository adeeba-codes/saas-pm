package com.saas.pm.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saas.pm.dto.MemberDtos.*;
import com.saas.pm.dto.MemberDtos.ChangeRoleRequest;
import com.saas.pm.dto.MemberDtos.InviteRequest;
import com.saas.pm.dto.MemberDtos.InviteResponse;
import com.saas.pm.dto.MemberDtos.MemberSummary;
import com.saas.pm.service.MemberService;

@RestController
@RequestMapping("/api/organizations/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    // No organizationId anywhere in this controller — same pattern as
    // ProjectController. The org always comes from the JWT via
    // TenantContext inside the service layer, never from the client.

    @GetMapping
    public List<MemberSummary> listMembers() {
        return memberService.listMembers();
    }

    @PostMapping("/invite")
    public InviteResponse invite(@RequestBody InviteRequest request) {
        return memberService.invite(request);
    }

    @PatchMapping("/{userId}/role")
    public MemberSummary changeRole(@PathVariable UUID userId, @RequestBody ChangeRoleRequest request) {
        return memberService.changeRole(userId, request.role());
    }

    @DeleteMapping("/{userId}")
    public void removeMember(@PathVariable UUID userId) {
        memberService.removeMember(userId);
    }
}