package com.saas.pm.controller;

import java.util.UUID;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.saas.pm.service.PresenceService;

// This is a STOMP message controller, not a REST controller — it
// handles messages the CLIENT sends over the WebSocket connection,
// distinct from TaskController/ProjectController which handle HTTP.
@Controller
public class PresenceController {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    public PresenceController(PresenceService presenceService, SimpMessagingTemplate messagingTemplate) {
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
    }

    // Client sends a message to /app/projects/{projectId}/presence/join
    // with just {"email": "..."} as the body when they open a board.
    //
    // Honest limitation: this identity comes from the client's own
    // request body, not from a verified JWT — our WebSocket handshake
    // (see SecurityConfig: "/ws/**" is permitAll) doesn't authenticate
    // the STOMP session the way HTTP requests are authenticated. That's
    // fine for a low-stakes UX feature like "who's viewing this board,"
    // but it's not something to rely on for anything security-sensitive.
    // A production version would extract identity from a verified
    // STOMP CONNECT header instead of trusting the payload.
    @MessageMapping("/projects/{projectId}/presence/join")
    public void join(@DestinationVariable UUID projectId, PresenceJoinMessage message,
                      SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        presenceService.join(projectId, sessionId, message.email());
        broadcast(projectId);
    }

    private void broadcast(UUID projectId) {
        messagingTemplate.convertAndSend(
                "/topic/projects/" + projectId + "/presence",
                presenceService.getViewers(projectId)
        );
    }

    public record PresenceJoinMessage(String email) {}
}