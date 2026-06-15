package com.chatapp.dto;
import java.time.LocalDateTime;
public class MessageDTO {
    public Long id, roomId, senderId;
    public String content, senderUsername, senderAvatarColor, type, readStatus;
    public LocalDateTime sentAt;
    public MessageDTO() {}
    public static MessageDTOBuilder builder() { return new MessageDTOBuilder(); }
    public static class MessageDTOBuilder {
        private Long id, roomId, senderId; private String content, senderUsername, senderAvatarColor, type, readStatus; private LocalDateTime sentAt;
        public MessageDTOBuilder id(Long v) { this.id=v; return this; }
        public MessageDTOBuilder roomId(Long v) { this.roomId=v; return this; }
        public MessageDTOBuilder senderId(Long v) { this.senderId=v; return this; }
        public MessageDTOBuilder content(String v) { this.content=v; return this; }
        public MessageDTOBuilder senderUsername(String v) { this.senderUsername=v; return this; }
        public MessageDTOBuilder senderAvatarColor(String v) { this.senderAvatarColor=v; return this; }
        public MessageDTOBuilder type(String v) { this.type=v; return this; }
        public MessageDTOBuilder readStatus(String v) { this.readStatus=v; return this; }
        public MessageDTOBuilder sentAt(LocalDateTime v) { this.sentAt=v; return this; }
        public MessageDTO build() { MessageDTO m=new MessageDTO(); m.id=id; m.roomId=roomId; m.senderId=senderId; m.content=content; m.senderUsername=senderUsername; m.senderAvatarColor=senderAvatarColor; m.type=type; m.readStatus=readStatus; m.sentAt=sentAt; return m; }
    }
}
