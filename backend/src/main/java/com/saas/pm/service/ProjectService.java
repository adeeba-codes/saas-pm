package com.saas.pm.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.saas.pm.entity.Organization;
import com.saas.pm.entity.Project;
import com.saas.pm.repository.OrganizationRepository;
import com.saas.pm.repository.ProjectRepository;
import com.saas.pm.security.TenantContext;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;

    public ProjectService(
            ProjectRepository projectRepository,
            OrganizationRepository organizationRepository
    ) {
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
    }

    // Returns ONLY projects belonging to the current request's organization.
    // TenantContext.getOrgId() comes from the JWT.
    public List<Project> listProjects() {
        UUID orgId = TenantContext.getOrgId();
        return projectRepository.findByOrganizationId(orgId);
    }

    public Project getProject(UUID projectId) {
        UUID orgId = TenantContext.getOrgId();

        // Only returns the project if it belongs to the current organization.
        return projectRepository.findByIdAndOrganizationId(projectId, orgId)
                .orElseThrow(() ->
                        new SecurityException("Project not found or access denied"));
    }

    public Project createProject(String name) {
        // Only ADMIN and MEMBER can create projects.
        String role = TenantContext.getRole();

        if (role.equals("VIEWER")) {
            throw new SecurityException("Viewers cannot create projects");
        }

        // Get the organization from the current tenant context.
        UUID orgId = TenantContext.getOrgId();

        // IMPORTANT:
        // Fetch the existing Organization from the database.
        // Do NOT use new Organization(), because that creates
        // an unsaved/transient entity.
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() ->
                        new SecurityException("Organization not found"));

        Project project = new Project();
        project.setName(name);
        project.setOrganization(org);

        return projectRepository.save(project);
    }
}