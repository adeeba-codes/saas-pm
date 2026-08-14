package com.saas.pm.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Frontend connects here. withSockJS() gives a fallback for
        // browsers/networks that block raw WebSockets.
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Clients SUBSCRIBE to /topic/... channels (e.g. /topic/projects/{id})
        // to receive live updates.
        registry.enableSimpleBroker("/topic");
        // Clients SEND messages to /app/... destinations (not used yet here
        // since we broadcast from the backend service layer instead, but
        // this is where you'd wire it if the frontend needed to push
        // directly, e.g. for a "typing" indicator).
        registry.setApplicationDestinationPrefixes("/app");
    }
}
