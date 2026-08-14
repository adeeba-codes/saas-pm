package com.saas.pm.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "app_users") // "users" is a reserved word in Postgres, so avoid it
public class User {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    // THIS is the core of multi-tenancy: every user belongs to exactly
    // one organization. Every query for this user's data will be
    // filtered by this organizationId.
    @ManyToOne
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    private Role role = Role.MEMBER;

    public enum Role { ADMIN, MEMBER, VIEWER }

    // --- getters and setters ---
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
