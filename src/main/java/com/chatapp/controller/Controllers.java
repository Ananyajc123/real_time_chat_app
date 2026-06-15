package com.chatapp.controller;

import com.chatapp.dto.*;
import com.chatapp.model.User;
import com.chatapp.service.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.http.*;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/auth")
class AuthController {
    @Autowired private AuthService authService;
    @PostMapping("/register") public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req)); }
    @PostMapping("/login") public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) { return ResponseEntity.ok(authService.login(req)); }
}

@RestController @RequestMapping("/api/chat")
class ChatController {
    @Autowired private ChatService chatService;
    @GetMapping("/rooms") public ResponseEntity<List<RoomDTO>> getRooms(@AuthenticationPrincipal UserDetails user) { return ResponseEntity.ok(chatService.getUserRooms(user.getUsername())); }
    @PostMapping("/rooms/dm/{targetUserId}") public ResponseEntity<RoomDTO> createDM(@PathVariable Long targetUserId, @AuthenticationPrincipal UserDetails user) { return ResponseEntity.ok(chatService.getOrCreateDirectRoom(targetUserId, user.getUsername())); }
    @PostMapping("/rooms/group") public ResponseEntity<RoomDTO> createGroup(@RequestBody Map<String, Object> request, @AuthenticationPrincipal UserDetails user) {
        String name = (String) request.get("name");
        @SuppressWarnings("unchecked") List<Long> memberIds = (List<Long>) request.get("memberIds");
        return ResponseEntity.ok(chatService.createGroupRoom(name, memberIds, user.getUsername()));
    }
    @GetMapping("/rooms/{roomId}/messages") public ResponseEntity<List<MessageDTO>> getHistory(@PathVariable Long roomId, @RequestParam(defaultValue="50") int limit, @AuthenticationPrincipal UserDetails user) { return ResponseEntity.ok(chatService.getRoomHistory(roomId, user.getUsername(), limit)); }
    @GetMapping("/rooms/{roomId}/messages/search") public ResponseEntity<List<MessageDTO>> searchMessages(@PathVariable Long roomId, @RequestParam String query, @AuthenticationPrincipal UserDetails user) { return ResponseEntity.ok(chatService.searchMessagesInRoom(roomId, query, user.getUsername())); }
    @DeleteMapping("/messages/{messageId}") public ResponseEntity<Void> deleteMessage(@PathVariable Long messageId, @AuthenticationPrincipal UserDetails user) { chatService.deleteMessage(messageId, user.getUsername()); return ResponseEntity.ok().build(); }
    @GetMapping("/users/search") public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam String query) { return ResponseEntity.ok(chatService.searchUsers(query)); }
    @GetMapping("/users/online") public ResponseEntity<List<UserDTO>> getOnlineUsers() { return ResponseEntity.ok(chatService.getOnlineUsers()); }
    @GetMapping("/users/{userId}") public ResponseEntity<UserDTO> getUserProfile(@PathVariable Long userId) { return ResponseEntity.ok(chatService.getUserProfile(userId)); }
    @PutMapping("/users/profile") public ResponseEntity<UserDTO> updateProfile(@RequestBody Map<String, String> request, @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(chatService.updateUserProfile(user.getUsername(), request.get("bio"), request.get("avatarColor")));
    }
}

@org.springframework.stereotype.Controller
class WebSocketChatController {
    @Autowired private ChatService chatService;
    @org.springframework.messaging.handler.annotation.MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest request, Principal principal) { chatService.sendMessage(request, principal.getName()); }
    @org.springframework.messaging.handler.annotation.MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload, Principal principal) {
        Long roomId = Long.parseLong(payload.get("roomId").toString());
        boolean isTyping = Boolean.parseBoolean(payload.get("isTyping").toString());
        chatService.publishTyping(roomId, principal.getName(), isTyping);
    }
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        try { if (event.getUser() != null) chatService.updateUserStatus(event.getUser().getName(), User.OnlineStatus.OFFLINE); } catch (Exception ignored) {}
    }
}

@RestController
class HealthController {
    @GetMapping("/health") public ResponseEntity<String> health() { return ResponseEntity.ok("OK"); }
}
