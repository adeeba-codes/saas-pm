package com.saas.pm.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

// Each row here = one tenant (company using your SaaS).
// Every other table (User, Project, Task) will reference organization_id
// so data never leaks between tenants.
@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    // Subscription tier: FREE or PRO. Used later to gate features
    // (e.g. FREE orgs can only create 3 projects).
    @Enumerated(EnumType.STRING)
    private SubscriptionTier tier = SubscriptionTier.FREE;

    private Instant createdAt = Instant.now();

    public enum SubscriptionTier { FREE, PRO }

    // --- getters and setters ---
    public UUID getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public SubscriptionTier getTier() { return tier; }
    public void setTier(SubscriptionTier tier) { this.tier = tier; }
    public Instant getCreatedAt() { return createdAt; }
}
