package com.chatapp.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name = "messages")
public class Message {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 1000) private String content;
    @Enumerated(EnumType.STRING) private MessageType type = MessageType.TEXT;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "sender_id", nullable = false) private User sender;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "room_id", nullable = false) private ChatRoom room;
    @Enumerated(EnumType.STRING) private ReadStatus readStatus = ReadStatus.SENT;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    @PrePersist protected void onCreate() { sentAt = LocalDateTime.now(); }
    public Message() {}
    public Long getId() { return id; } public void setId(Long v) { this.id=v; }
    public String getContent() { return content; } public void setContent(String v) { this.content=v; }
    public MessageType getType() { return type; } public void setType(MessageType v) { this.type=v; }
    public User getSender() { return sender; } public void setSender(User v) { this.sender=v; }
    public ChatRoom getRoom() { return room; } public void setRoom(ChatRoom v) { this.room=v; }
    public ReadStatus getReadStatus() { return readStatus; } public void setReadStatus(ReadStatus v) { this.readStatus=v; }
    public LocalDateTime getSentAt() { return sentAt; }
    public enum MessageType { TEXT, IMAGE, FILE, SYSTEM }
    public enum ReadStatus { SENT, DELIVERED, READ }
    public static MessageBuilder builder() { return new MessageBuilder(); }
    public static class MessageBuilder {
        private String content; private MessageType type = MessageType.TEXT; private User sender; private ChatRoom room; private ReadStatus readStatus = ReadStatus.SENT;
        public MessageBuilder content(String v) { this.content=v; return this; }
        public MessageBuilder type(MessageType v) { this.type=v; return this; }
        public MessageBuilder sender(User v) { this.sender=v; return this; }
        public MessageBuilder room(ChatRoom v) { this.room=v; return this; }
        public MessageBuilder readStatus(ReadStatus v) { this.readStatus=v; return this; }
        public Message build() { Message m=new Message(); m.content=content; m.type=type; m.sender=sender; m.room=room; m.readStatus=readStatus; return m; }
    }
}
