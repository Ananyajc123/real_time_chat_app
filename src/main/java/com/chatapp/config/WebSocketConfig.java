package com.chatapp.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Configure the message broker.
     *
     * INTERVIEW ANSWER: "How does WebSocket work?"
     * HTTP is request-response — client always initiates.
     * WebSocket is full-duplex — both client and server can send anytime.
     * We use STOMP protocol over WebSocket for structured messaging.
     *
     * Message flow:
     * Client sends → /app/chat.send
     *   → ChatController handles it
     *   → publishes to Redis Pub/Sub
     *   → Redis delivers to ALL server instances
     *   → each server broadcasts to /topic/room/{roomId}
     *   → subscribed clients receive it instantly
     *
     * Why Redis Pub/Sub?
     * Without it, if user A is on Server 1 and user B is on Server 2,
     * Server 1 can't directly send to user B's WebSocket on Server 2.
     * Redis acts as the message bus between servers.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Client subscribes to: /topic/room/{roomId}, /user/queue/notifications
        registry.enableSimpleBroker("/topic", "/queue");

        // Client sends messages to: /app/chat.send, /app/chat.typing
        registry.setApplicationDestinationPrefixes("/app");

        // For user-specific messages: /user/{username}/queue/...
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket handshake endpoint — client connects here first
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // SockJS fallback for browsers that don't support WebSocket
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            String userEmail = jwtUtil.extractUsername(token);
                            if (jwtUtil.validateToken(token, userEmail)) {
                                UsernamePasswordAuthenticationToken authentication = 
                                    new UsernamePasswordAuthenticationToken(userEmail, null, null);
                                accessor.setUser(authentication);
                            }
                        } catch (Exception e) {
                            System.err.println("WebSocket JWT validation failed: " + e.getMessage());
                        }
                    }
                }
                return message;
            }
        });
    }
}
