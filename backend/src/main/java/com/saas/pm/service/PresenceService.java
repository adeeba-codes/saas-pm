package com.saas.pm.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

// In-memory presence tracking: which users are currently viewing
// which project board. Deliberately NOT persisted to the database —
// presence is transient by nature (it's meaningless after a restart),
// so a plain in-memory map is the correct tool here, not overkill.
//
// Honest limitation: this only works correctly with a single backend
// instance. If you ever deployed multiple backend instances behind a
// load balancer, this state wouldn't be shared between them — you'd
// need Redis or similar for that. Fine for a student project; worth
// knowing as a real scaling boundary if asked in an interview.
@Service
public class PresenceService {

    // projectId -> (sessionId -> email)
    // Keyed by WebSocket session, not by user, because the same user
    // could theoretically have two tabs open — each gets its own
    // session and its own presence entry.
    private final Map<UUID, Map<String, String>> viewersByProject = new ConcurrentHashMap<>();

    // sessionId -> projectId, so we can find which project to clean up
    // when a session disconnects, without scanning every project.
    private final Map<String, UUID> projectBySession = new ConcurrentHashMap<>();

    public void join(UUID projectId, String sessionId, String email) {
        viewersByProject
                .computeIfAbsent(projectId, k -> new ConcurrentHashMap<>())
                .put(sessionId, email);
        projectBySession.put(sessionId, projectId);
    }

    // Called when a WebSocket session disconnects (tab closed, browser
    // crashed, network dropped). Returns the affected projectId so the
    // caller can broadcast an updated viewer list to everyone still there.
    public Optional<UUID> leave(String sessionId) {
        UUID projectId = projectBySession.remove(sessionId);
        if (projectId == null) return Optional.empty();

        Map<String, String> viewers = viewersByProject.get(projectId);
        if (viewers != null) {
            viewers.remove(sessionId);
            if (viewers.isEmpty()) {
                viewersByProject.remove(projectId);
            }
        }
        return Optional.of(projectId);
    }

    public List<String> getViewers(UUID projectId) {
        Map<String, String> viewers = viewersByProject.get(projectId);
        if (viewers == null) return List.of();
        return new ArrayList<>(new HashSet<>(viewers.values())); // dedupe if same user has 2 tabs open
    }
}