package com.chatapp.service;

import com.chatapp.dto.MessageDTO;
import com.chatapp.dto.WebSocketMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisMessageSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Called whenever Redis delivers a message on a subscribed channel.
     *
     * INTERVIEW ANSWER: "How does message delivery work across servers?"
     *
     * 1. User sends message via WebSocket → ChatController
     * 2. ChatController saves to DB + publishes to Redis: PUBLISH chat:room:42 "{...json...}"
     * 3. Redis delivers to ALL server instances subscribed to chat:room:*
     * 4. This method (onMessage) is called on each server instance
     * 5. We broadcast to /topic/room/42 → all WebSocket clients subscribed to that room receive it
     *
     * This is the Redis Pub/Sub pattern for horizontal scaling.
     */
    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            String body = new String(message.getBody());

            if (channel.startsWith("chat:room:")) {
                // Extract room ID from channel name: "chat:room:42" → "42"
                String roomId = channel.replace("chat:room:", "");

                // Parse the message payload
                WebSocketMessage wsMessage = objectMapper.readValue(body, WebSocketMessage.class);

                // Broadcast to all WebSocket clients subscribed to this room
                messagingTemplate.convertAndSend("/topic/room/" + roomId, wsMessage);

                log.debug("Delivered message to room {}", roomId);

            } else if (channel.equals("chat:status")) {
                // Broadcast online status update to all connected clients
                WebSocketMessage wsMessage = objectMapper.readValue(body, WebSocketMessage.class);
                messagingTemplate.convertAndSend("/topic/status", wsMessage);
            }

        } catch (Exception e) {
            log.error("Failed to process Redis message: {}", e.getMessage());
        }
    }
}
