package com.chatapp.config;

import com.chatapp.service.RedisMessageSubscriber;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    /**
     * Redis Pub/Sub setup.
     *
     * INTERVIEW ANSWER: "How does your chat scale across multiple servers?"
     *
     * Problem: User A connects to Server 1, User B connects to Server 2.
     * Server 1 can't push to User B's WebSocket connection on Server 2.
     *
     * Solution: Redis Pub/Sub acts as message bus:
     * Server 1 → PUBLISH to Redis channel "chat:room:42"
     * Redis → delivers to ALL servers subscribed to "chat:room:42"
     * Server 2 → receives message → pushes to User B via WebSocket
     *
     * Pattern: "chat:room:*" — subscribes to ALL room channels at once.
     */

    public static final String CHAT_CHANNEL_PATTERN = "chat:room:*";
    public static final String STATUS_CHANNEL = "chat:status";

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisMessageListenerContainer redisContainer(
            RedisConnectionFactory factory,
            MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);

        // Subscribe to all room channels: chat:room:1, chat:room:2, etc.
        container.addMessageListener(listenerAdapter,
                new PatternTopic(CHAT_CHANNEL_PATTERN));

        // Subscribe to status channel
        container.addMessageListener(listenerAdapter,
                new PatternTopic(STATUS_CHANNEL));

        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter(RedisMessageSubscriber subscriber) {
        return new MessageListenerAdapter(subscriber, "onMessage");
    }
}
