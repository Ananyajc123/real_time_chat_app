package com.chatapp.dto;
import java.time.LocalDateTime;
import java.util.List;
public class RoomDTO {
    public Long id; public String name, type, lastMessage; public LocalDateTime lastMessageTime, createdAt; public Long unreadCount; public List<UserDTO> members;
    public RoomDTO() {}
    public Long getId() { return id; }
    public static RoomDTOBuilder builder() { return new RoomDTOBuilder(); }
    public static class RoomDTOBuilder {
        private Long id; private String name, type, lastMessage; private LocalDateTime lastMessageTime, createdAt; private Long unreadCount; private List<UserDTO> members;
        public RoomDTOBuilder id(Long v) { this.id=v; return this; }
        public RoomDTOBuilder name(String v) { this.name=v; return this; }
        public RoomDTOBuilder type(String v) { this.type=v; return this; }
        public RoomDTOBuilder lastMessage(String v) { this.lastMessage=v; return this; }
        public RoomDTOBuilder lastMessageTime(LocalDateTime v) { this.lastMessageTime=v; return this; }
        public RoomDTOBuilder createdAt(LocalDateTime v) { this.createdAt=v; return this; }
        public RoomDTOBuilder unreadCount(Long v) { this.unreadCount=v; return this; }
        public RoomDTOBuilder members(List<UserDTO> v) { this.members=v; return this; }
        public RoomDTO build() { RoomDTO r=new RoomDTO(); r.id=id; r.name=name; r.type=type; r.lastMessage=lastMessage; r.lastMessageTime=lastMessageTime; r.createdAt=createdAt; r.unreadCount=unreadCount; r.members=members; return r; }
    }
}
