package com.chatapp;

import com.chatapp.dto.*;
import com.chatapp.model.*;
import com.chatapp.repository.*;
import com.chatapp.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private MessageRepository messageRepository;
    @Mock private ChatRoomRepository chatRoomRepository;
    @Mock private UserRepository userRepository;
    @Mock private RedisTemplate<String, String> redisTemplate;

    @InjectMocks private ChatService chatService;

    private User alice, bob;
    private ChatRoom room;

    @BeforeEach
    void setUp() {
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        ReflectionTestUtils.setField(chatService, "objectMapper", mapper);

        alice = new User();
        alice.setEmail("alice@demo.com");
        alice.setUsername("alice");
        alice.setAvatarColor("#4f46e5");
        alice.setStatus(User.OnlineStatus.ONLINE);
        ReflectionTestUtils.setField(alice, "id", 1L);

        bob = new User();
        bob.setEmail("bob@demo.com");
        bob.setUsername("bob");
        bob.setAvatarColor("#10b981");
        bob.setStatus(User.OnlineStatus.ONLINE);
        ReflectionTestUtils.setField(bob, "id", 2L);

        room = new ChatRoom();
        room.setType(ChatRoom.RoomType.GROUP);
        room.setMembers(List.of(alice, bob));
        ReflectionTestUtils.setField(room, "id", 1L);
        ReflectionTestUtils.setField(room, "createdAt", LocalDateTime.now());
    }

    @Test
    void shouldSendMessage_successfully() {
        SendMessageRequest req = new SendMessageRequest(1L, "Hello Bob!", "TEXT");

        when(userRepository.findByEmail("alice@demo.com")).thenReturn(Optional.of(alice));
        when(chatRoomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            ReflectionTestUtils.setField(m, "id", 1L);
            ReflectionTestUtils.setField(m, "sentAt", LocalDateTime.now());
            return m;
        });

        MessageDTO result = chatService.sendMessage(req, "alice@demo.com");

        assertNotNull(result);
        assertEquals("Hello Bob!", result.content);
        assertEquals("alice", result.senderUsername);
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    void shouldThrow_whenUserNotMemberOfRoom() {
        User charlie = new User();
        charlie.setEmail("charlie@demo.com");
        charlie.setUsername("charlie");
        ReflectionTestUtils.setField(charlie, "id", 3L);

        SendMessageRequest req = new SendMessageRequest(1L, "Hello!", "TEXT");
        when(userRepository.findByEmail("charlie@demo.com")).thenReturn(Optional.of(charlie));
        when(chatRoomRepository.findById(1L)).thenReturn(Optional.of(room));

        assertThrows(RuntimeException.class,
                () -> chatService.sendMessage(req, "charlie@demo.com"));
    }

    @Test
    void shouldCreateDirectRoom_whenNotExists() {
        when(userRepository.findByEmail("alice@demo.com")).thenReturn(Optional.of(alice));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        when(chatRoomRepository.findDirectRoom(1L, 2L)).thenReturn(Optional.empty());
        when(chatRoomRepository.save(any(ChatRoom.class))).thenAnswer(inv -> {
            ChatRoom r = inv.getArgument(0);
            ReflectionTestUtils.setField(r, "id", 99L);
            ReflectionTestUtils.setField(r, "createdAt", LocalDateTime.now());
            return r;
        });

        RoomDTO result = chatService.getOrCreateDirectRoom(2L, "alice@demo.com");

        assertNotNull(result);
        assertEquals("bob", result.name);
        verify(chatRoomRepository).save(any(ChatRoom.class));
    }

    @Test
    void shouldReturnExistingDM_whenAlreadyExists() {
        ChatRoom dmRoom = new ChatRoom();
        dmRoom.setType(ChatRoom.RoomType.DIRECT);
        dmRoom.setMembers(List.of(alice, bob));
        ReflectionTestUtils.setField(dmRoom, "id", 5L);
        ReflectionTestUtils.setField(dmRoom, "createdAt", LocalDateTime.now());

        when(userRepository.findByEmail("alice@demo.com")).thenReturn(Optional.of(alice));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        when(chatRoomRepository.findDirectRoom(1L, 2L)).thenReturn(Optional.of(dmRoom));

        RoomDTO result = chatService.getOrCreateDirectRoom(2L, "alice@demo.com");

        assertEquals(5L, result.id);
        verify(chatRoomRepository, never()).save(any());
    }

    @Test
    void shouldGetRoomHistory_andMarkAsRead() {
        Message msg = new Message();
        msg.setContent("Hi");
        msg.setSender(bob);
        msg.setRoom(room);
        msg.setType(Message.MessageType.TEXT);
        msg.setReadStatus(Message.ReadStatus.SENT);
        ReflectionTestUtils.setField(msg, "id", 1L);
        ReflectionTestUtils.setField(msg, "sentAt", LocalDateTime.now());

        when(userRepository.findByEmail("alice@demo.com")).thenReturn(Optional.of(alice));
        when(messageRepository.findLatestByRoomId(eq(1L), any(Pageable.class)))
                .thenReturn(List.of(msg));

        List<MessageDTO> result = chatService.getRoomHistory(1L, "alice@demo.com", 50);

        assertEquals(1, result.size());
        assertEquals("Hi", result.get(0).content);
        verify(messageRepository).markAsRead(1L, alice.getId());
    }

    @Test
    void shouldSearchUsers_byUsername() {
        when(userRepository.findByUsernameContainingIgnoreCase("ali"))
                .thenReturn(List.of(alice));

        List<UserDTO> result = chatService.searchUsers("ali");

        assertEquals(1, result.size());
        assertEquals("alice", result.get(0).username);
    }
}
