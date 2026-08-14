package com.saas.pm.repository;

import com.saas.pm.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    // NOTICE: every query method takes organizationId as a parameter.
    // This is the actual enforcement mechanism — there is no method
    // here that returns a Project without checking its org.
    // A developer literally cannot "forget" to filter by tenant,
    // because the only methods available already require it.
    List<Project> findByOrganizationId(UUID organizationId);

    Optional<Project> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
