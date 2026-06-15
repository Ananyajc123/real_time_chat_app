package com.chatapp.service;

import com.chatapp.dto.*;
import com.chatapp.model.*;
import com.chatapp.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    @Autowired private MessageRepository messageRepository;
    @Autowired private ChatRoomRepository chatRoomRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RedisTemplate<String, String> redisTemplate;
    @Autowired private ObjectMapper objectMapper;

    @Transactional
    public MessageDTO sendMessage(SendMessageRequest request, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        ChatRoom room = chatRoomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        boolean isMember = room.getMembers().stream().anyMatch(m -> m.getId().equals(sender.getId()));
        if (!isMember) throw new RuntimeException("Not a member of this room");

        Message message = Message.builder()
                .content(request.getContent())
                .type(Message.MessageType.valueOf(request.getType() != null ? request.getType() : "TEXT"))
                .sender(sender).room(room).readStatus(Message.ReadStatus.SENT).build();
        messageRepository.save(message);

        MessageDTO dto = toDTO(message);
        publishToRedis("chat:room:" + room.getId(), "MESSAGE", dto);
        return dto;
    }

    @Transactional
    public List<MessageDTO> getRoomHistory(Long roomId, String userEmail, int limit) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        messageRepository.markAsRead(roomId, user.getId());
        List<Message> messages = messageRepository.findLatestByRoomId(roomId, PageRequest.of(0, limit));
        Collections.reverse(messages);
        return messages.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<RoomDTO> getUserRooms(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return chatRoomRepository.findRoomsByUserId(user.getId()).stream().map(room -> {
            List<Message> messages = messageRepository.findLatestByRoomId(room.getId(), PageRequest.of(0, 1));
            Long unread = messageRepository.countUnread(room.getId(), user.getId());
            String displayName = room.getName();
            if (room.getType() == ChatRoom.RoomType.DIRECT) {
                displayName = room.getMembers().stream()
                        .filter(m -> !m.getId().equals(user.getId()))
                        .map(User::getUsername).findFirst().orElse("Unknown");
            }
            RoomDTO dto = RoomDTO.builder().id(room.getId()).name(displayName)
                    .type(room.getType().name())
                    .lastMessage(messages.isEmpty() ? null : messages.get(0).getContent())
                    .lastMessageTime(messages.isEmpty() ? room.getCreatedAt() : messages.get(0).getSentAt())
                    .unreadCount(unread).createdAt(room.getCreatedAt())
                    .members(room.getMembers().stream().map(this::toUserDTO).collect(Collectors.toList()))
                    .build();
            return dto;
        }).sorted(Comparator.comparing(r -> r.lastMessageTime != null ? r.lastMessageTime : LocalDateTime.MIN, Comparator.reverseOrder()))
        .collect(Collectors.toList());
    }

    @Transactional
    public RoomDTO getOrCreateDirectRoom(Long targetUserId, String userEmail) {
        User sender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Optional<ChatRoom> existing = chatRoomRepository.findDirectRoom(sender.getId(), target.getId());
        if (existing.isPresent()) return toRoomDTO(existing.get(), sender.getId());
        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .type(ChatRoom.RoomType.DIRECT).members(List.of(sender, target)).build());
        return toRoomDTO(room, sender.getId());
    }

    public void publishTyping(Long roomId, String username, boolean isTyping) {
        Map<String, Object> payload = Map.of("roomId", roomId, "username", username, "isTyping", isTyping);
        publishToRedis("chat:room:" + roomId, "TYPING", payload);
    }

    @Transactional
    public void updateUserStatus(String userEmail, User.OnlineStatus status) {
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            user.setStatus(status);
            if (status == User.OnlineStatus.OFFLINE) user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
            Map<String, Object> payload = Map.of("userId", user.getId(), "username", user.getUsername(), "status", status.name());
            publishToRedis("chat:status", "USER_STATUS", payload);
        });
    }

    public List<UserDTO> searchUsers(String query) {
        return userRepository.findByUsernameContainingIgnoreCase(query)
                .stream().map(this::toUserDTO).collect(Collectors.toList());
    }

    public List<UserDTO> getOnlineUsers() {
        return userRepository.findByStatus(User.OnlineStatus.ONLINE)
                .stream().map(this::toUserDTO).collect(Collectors.toList());
    }

    public UserDTO getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toUserDTO(user);
    }

    @Transactional
    public UserDTO updateUserProfile(String userEmail, String bio, String avatarColor) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (bio != null) user.setBio(bio);
        if (avatarColor != null) user.setAvatarColor(avatarColor);
        userRepository.save(user);
        return toUserDTO(user);
    }

    @Transactional
    public RoomDTO createGroupRoom(String name, List<Long> memberIds, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        List<User> members = userRepository.findAllById(memberIds);
        if (!members.contains(creator)) members.add(creator);
        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .name(name).type(ChatRoom.RoomType.GROUP).members(members).build());
        return toRoomDTO(room, creator.getId());
    }

    public List<MessageDTO> searchMessagesInRoom(Long roomId, String query, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        boolean isMember = room.getMembers().stream().anyMatch(m -> m.getId().equals(user.getId()));
        if (!isMember) throw new RuntimeException("Not a member of this room");
        return messageRepository.searchInRoom(roomId, query.toLowerCase())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public void deleteMessage(Long messageId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!message.getSender().getId().equals(user.getId()))
            throw new RuntimeException("Can only delete own messages");
        messageRepository.delete(message);
        MessageDTO dto = toDTO(message);
        publishToRedis("chat:room:" + message.getRoom().getId(), "MESSAGE_DELETED", Map.of("messageId", messageId));
    }

    private void publishToRedis(String channel, String type, Object payload) {
        try {
            WebSocketMessage msg = new WebSocketMessage(type, payload);
            String json = objectMapper.writeValueAsString(msg);
            redisTemplate.convertAndSend(channel, json);
        } catch (Exception e) { log.error("Failed to publish to Redis: {}", e.getMessage()); }
    }

    private MessageDTO toDTO(Message m) {
        return MessageDTO.builder().id(m.getId()).roomId(m.getRoom().getId())
                .senderId(m.getSender().getId()).senderUsername(m.getSender().getUsername())
                .senderAvatarColor(m.getSender().getAvatarColor()).content(m.getContent())
                .type(m.getType().name()).readStatus(m.getReadStatus().name()).sentAt(m.getSentAt()).build();
    }

    private UserDTO toUserDTO(User u) {
        return UserDTO.builder().id(u.getId()).username(u.getUsername())
                .email(u.getEmail()).avatarColor(u.getAvatarColor()).status(u.getStatus().name()).bio(u.getBio()).build();
    }

    private RoomDTO toRoomDTO(ChatRoom room, Long userId) {
        String name = room.getName();
        if (room.getType() == ChatRoom.RoomType.DIRECT)
            name = room.getMembers().stream().filter(m -> !m.getId().equals(userId))
                    .map(User::getUsername).findFirst().orElse("Unknown");
        return RoomDTO.builder().id(room.getId()).name(name).type(room.getType().name())
                .createdAt(room.getCreatedAt())
                .members(room.getMembers().stream().map(this::toUserDTO).collect(Collectors.toList())).build();
    }
}
