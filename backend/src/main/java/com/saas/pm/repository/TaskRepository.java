package com.saas.pm.repository;

import com.saas.pm.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    // Same pattern as ProjectRepository: organizationId is always
    // part of the query, never optional.
    List<Task> findByProjectIdAndOrganizationId(UUID projectId, UUID organizationId);
    Optional<Task> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
