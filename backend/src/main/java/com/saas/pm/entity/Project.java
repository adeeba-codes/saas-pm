package com.saas.pm.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    // Every project belongs to exactly one organization.
    // This is the column we filter on for tenant isolation.
    @ManyToOne
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    public UUID getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
}
