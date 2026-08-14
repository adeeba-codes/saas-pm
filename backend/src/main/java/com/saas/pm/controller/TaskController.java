package com.saas.pm.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saas.pm.dto.TaskDtos.CreateTaskRequest;
import com.saas.pm.dto.TaskDtos.TaskResponse;
import com.saas.pm.dto.TaskDtos.UpdateDetailsRequest;
import com.saas.pm.dto.TaskDtos.UpdateStatusRequest;
import com.saas.pm.service.TaskService;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskResponse> listTasks(@PathVariable UUID projectId) {
        return taskService.listTasks(projectId);
    }

    @PostMapping
    public TaskResponse createTask(@PathVariable UUID projectId, @RequestBody CreateTaskRequest request) {
        return taskService.createTask(projectId, request);
    }

    @PatchMapping("/{taskId}/status")
    public TaskResponse updateStatus(@PathVariable UUID taskId, @RequestBody UpdateStatusRequest request) {
        return taskService.updateStatus(taskId, request.status());
    }

    // New endpoint — editing priority/dueDate/assignee without
    // touching status, so the frontend can update these independently.
    @PatchMapping("/{taskId}/details")
    public TaskResponse updateDetails(@PathVariable UUID taskId, @RequestBody UpdateDetailsRequest request) {
        return taskService.updateDetails(taskId, request);
    }
}