package com.saas.pm.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.saas.pm.entity.Task;

public class TaskDtos {

    public record CreateTaskRequest(
            String title,
            Task.Priority priority,
            LocalDate dueDate,
            UUID assigneeId
    ) {}

    public record UpdateStatusRequest(Task.Status status) {}

    // Added `title` here so the detail drawer can rename a task too,
    // not just adjust priority/dueDate/assignee.
    public record UpdateDetailsRequest(
            String title,
            Task.Priority priority,
            LocalDate dueDate,
            UUID assigneeId
    ) {}

    public record AssigneeSummary(UUID id, String email) {}

    public record TaskResponse(
            UUID id,
            String title,
            Task.Status status,
            UUID projectId,
            Task.Priority priority,
            LocalDate dueDate,
            AssigneeSummary assignee
    ) {}
}