package com.saas.pm.config;

import java.util.UUID;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.saas.pm.service.PresenceService;

// This is the piece that makes presence actually reliable: without it,
// a user who closes their tab (rather than clicking some explicit
// "leave" button) would stay listed as "viewing" forever. Spring fires
// SessionDisconnectEvent automatically whenever a WebSocket connection
// drops for ANY reason — tab close, network loss, browser crash — so
// this is the one place cleanup is guaranteed to happen.
@Component
public class WebSocketEventListener {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventListener(PresenceService presenceService, SimpMessagingTemplate messagingTemplate) {
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        presenceService.leave(sessionId).ifPresent(this::broadcastUpdatedViewers);
    }

    private void broadcastUpdatedViewers(UUID projectId) {
        messagingTemplate.convertAndSend(
                "/topic/projects/" + projectId + "/presence",
                presenceService.getViewers(projectId)
        );
    }
}