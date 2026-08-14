package com.saas.pm.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.saas.pm.dto.TaskDtos.AssigneeSummary;
import com.saas.pm.dto.TaskDtos.CreateTaskRequest;
import com.saas.pm.dto.TaskDtos.TaskResponse;
import com.saas.pm.dto.TaskDtos.UpdateDetailsRequest;
import com.saas.pm.entity.Project;
import com.saas.pm.entity.Task;
import com.saas.pm.entity.User;
import com.saas.pm.repository.TaskRepository;
import com.saas.pm.repository.UserRepository;
import com.saas.pm.security.TenantContext;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final SimpMessagingTemplate messagingTemplate;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository,
                        ProjectService projectService, SimpMessagingTemplate messagingTemplate) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectService = projectService;
        this.messagingTemplate = messagingTemplate;
    }

    public List<TaskResponse> listTasks(UUID projectId) {
        UUID orgId = TenantContext.getOrgId();
        projectService.getProject(projectId); // access check
        return taskRepository.findByProjectIdAndOrganizationId(projectId, orgId).stream()
                .map(this::toResponse)
                .toList();
    }

    public TaskResponse createTask(UUID projectId, CreateTaskRequest req) {
        UUID orgId = TenantContext.getOrgId();
        Project project = projectService.getProject(projectId);

        // If an assignee was specified, verify they actually belong to
        // this org — otherwise a task could end up "assigned" to a
        // user from a completely different tenant, which would be a
        // real isolation bug, not just a display glitch.
        validateAssignee(req.assigneeId(), orgId);

        Task task = new Task();
        task.setTitle(req.title());
        task.setProject(project);
        task.setOrganizationId(orgId);
        task.setPriority(req.priority());
        task.setDueDate(req.dueDate());
        task.setAssigneeId(req.assigneeId());
        task = taskRepository.save(task);

        TaskResponse response = toResponse(task);
        broadcastUpdate(projectId, response);
        return response;
    }

    public TaskResponse updateStatus(UUID taskId, Task.Status newStatus) {
        UUID orgId = TenantContext.getOrgId();
        Task task = taskRepository.findByIdAndOrganizationId(taskId, orgId)
                .orElseThrow(() -> new SecurityException("Task not found or access denied"));

        task.setStatus(newStatus);
        task = taskRepository.save(task);

        TaskResponse response = toResponse(task);
        broadcastUpdate(task.getProject().getId(), response);
        return response;
    }

   public TaskResponse updateDetails(UUID taskId, UpdateDetailsRequest req) {
    UUID orgId = TenantContext.getOrgId();
    Task task = taskRepository.findByIdAndOrganizationId(taskId, orgId)
            .orElseThrow(() -> new SecurityException("Task not found or access denied"));

    validateAssignee(req.assigneeId(), orgId);

    // Only overwrite the title if one was actually sent — this lets
    // the frontend send a partial update (e.g. just priority) without
    // accidentally blanking the title if it forgets to include it.
    if (req.title() != null && !req.title().isBlank()) {
        task.setTitle(req.title());
    }
    task.setPriority(req.priority());
    task.setDueDate(req.dueDate());
    task.setAssigneeId(req.assigneeId());
    task = taskRepository.save(task);

    TaskResponse response = toResponse(task);
    broadcastUpdate(task.getProject().getId(), response);
    return response;
}

    private void validateAssignee(UUID assigneeId, UUID orgId) {
        if (assigneeId == null) return;
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new IllegalArgumentException("Assignee not found"));
        if (!assignee.getOrganization().getId().equals(orgId)) {
            throw new SecurityException("Cannot assign a task to a user outside your organization");
        }
    }

    // Resolves the raw assigneeId into a full AssigneeSummary for the
    // response. One extra DB lookup per task with an assignee — fine
    // at this scale; if this ever became a bottleneck, you'd fetch
    // all needed users in one batch query instead of one-by-one.
    private TaskResponse toResponse(Task task) {
        AssigneeSummary assignee = Optional.ofNullable(task.getAssigneeId())
                .flatMap(userRepository::findById)
                .map(u -> new AssigneeSummary(u.getId(), u.getEmail()))
                .orElse(null);

        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getStatus(),
                task.getProject().getId(),
                task.getPriority(),
                task.getDueDate(),
                assignee
        );
    }

    private void broadcastUpdate(UUID projectId, TaskResponse response) {
        messagingTemplate.convertAndSend("/topic/projects/" + projectId, response);
    }
}