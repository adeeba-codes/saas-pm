package com.saas.pm.entity;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    private Status status = Status.TODO;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private UUID organizationId;

    // --- New fields ---

    @Enumerated(EnumType.STRING)
    private Priority priority; // nullable — a task can have no priority set

    private LocalDate dueDate; // nullable

    // Deliberately just the ID, not a @ManyToOne to User. Keeping this
    // as a plain UUID avoids a bidirectional relationship for now, and
    // the service layer resolves it to a full user summary (email) when
    // returning tasks to the frontend, via a DTO — not by exposing this
    // raw column directly.
    private UUID assigneeId;

    public enum Status { TODO, IN_PROGRESS, DONE }
    public enum Priority { LOW, MEDIUM, HIGH, CRITICAL }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public UUID getAssigneeId() { return assigneeId; }
    public void setAssigneeId(UUID assigneeId) { this.assigneeId = assigneeId; }
}