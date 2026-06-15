package com.chatapp.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(unique = true, nullable = false) private String email;
    @Column(nullable = false) private String password;
    @Column(nullable = false) private String username;
    private String avatarColor;
    @Column(length = 500) private String bio;
    @Enumerated(EnumType.STRING) private OnlineStatus status = OnlineStatus.OFFLINE;
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    public User() {}
    public Long getId() { return id; } public void setId(Long v) { this.id=v; }
    public String getEmail() { return email; } public void setEmail(String v) { this.email=v; }
    public String getPassword() { return password; } public void setPassword(String v) { this.password=v; }
    public String getUsername() { return username; } public void setUsername(String v) { this.username=v; }
    public String getAvatarColor() { return avatarColor; } public void setAvatarColor(String v) { this.avatarColor=v; }
    public String getBio() { return bio; } public void setBio(String v) { this.bio=v; }
    public OnlineStatus getStatus() { return status; } public void setStatus(OnlineStatus v) { this.status=v; }
    public LocalDateTime getLastSeen() { return lastSeen; } public void setLastSeen(LocalDateTime v) { this.lastSeen=v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public enum OnlineStatus { ONLINE, OFFLINE, AWAY }
    public static UserBuilder builder() { return new UserBuilder(); }
    public static class UserBuilder {
        private String email, password, username, avatarColor, bio; private OnlineStatus status = OnlineStatus.OFFLINE;
        public UserBuilder email(String v) { this.email=v; return this; }
        public UserBuilder password(String v) { this.password=v; return this; }
        public UserBuilder username(String v) { this.username=v; return this; }
        public UserBuilder avatarColor(String v) { this.avatarColor=v; return this; }
        public UserBuilder bio(String v) { this.bio=v; return this; }
        public UserBuilder status(OnlineStatus v) { this.status=v; return this; }
        public User build() { User u=new User(); u.email=email; u.password=password; u.username=username; u.avatarColor=avatarColor; u.bio=bio; u.status=status; return u; }
    }
}
