package com.chatapp.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
@Entity @Table(name = "chat_rooms")
public class ChatRoom {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String name;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private RoomType type;
    private LocalDateTime createdAt;
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "room_members", joinColumns = @JoinColumn(name = "room_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private List<User> members;
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY) @OrderBy("sentAt ASC") private List<Message> messages;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    public ChatRoom() {}
    public Long getId() { return id; } public void setId(Long v) { this.id=v; }
    public String getName() { return name; } public void setName(String v) { this.name=v; }
    public RoomType getType() { return type; } public void setType(RoomType v) { this.type=v; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime v) { this.createdAt=v; }
    public List<User> getMembers() { return members; } public void setMembers(List<User> v) { this.members=v; }
    public List<Message> getMessages() { return messages; }
    public enum RoomType { DIRECT, GROUP }
    public static ChatRoomBuilder builder() { return new ChatRoomBuilder(); }
    public static class ChatRoomBuilder {
        private String name; private RoomType type; private List<User> members;
        public ChatRoomBuilder name(String v) { this.name=v; return this; }
        public ChatRoomBuilder type(RoomType v) { this.type=v; return this; }
        public ChatRoomBuilder members(List<User> v) { this.members=v; return this; }
        public ChatRoom build() { ChatRoom r=new ChatRoom(); r.name=name; r.type=type; r.members=members; return r; }
    }
}
