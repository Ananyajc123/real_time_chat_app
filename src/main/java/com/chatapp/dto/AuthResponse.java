package com.chatapp.dto;
public class AuthResponse {
    public String token, email, username, avatarColor; public Long userId;
    public AuthResponse() {}
    public AuthResponse(String token, String email, String username, String avatarColor, Long userId) {
        this.token=token; this.email=email; this.username=username; this.avatarColor=avatarColor; this.userId=userId;
    }
}
