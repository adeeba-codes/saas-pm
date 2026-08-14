package com.saas.pm.controller;

import com.saas.pm.entity.Project;
import com.saas.pm.service.ProjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    // Note: no organizationId parameter anywhere in this controller.
    // It's never taken from the client — always derived from the JWT
    // via TenantContext inside the service layer. This is deliberate:
    // if org came from a request parameter, a malicious client could
    // just pass a different org's ID and read their data.
    @GetMapping
    public List<Project> listProjects() {
        return projectService.listProjects();
    }

    @GetMapping("/{id}")
    public Project getProject(@PathVariable UUID id) {
        return projectService.getProject(id);
    }

    @PostMapping
    public Project createProject(@RequestBody CreateProjectRequest request) {
        return projectService.createProject(request.name());
    }

    public record CreateProjectRequest(String name) {}
}
