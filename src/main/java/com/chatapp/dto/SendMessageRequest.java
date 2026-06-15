package com.chatapp.dto;
import jakarta.validation.constraints.*;
public class SendMessageRequest {
    @NotNull public Long roomId;
    @NotBlank @Size(max=1000) public String content;
    public String type = "TEXT";
    public SendMessageRequest() {}
    public SendMessageRequest(Long roomId, String content, String type) { this.roomId=roomId; this.content=content; this.type=type; }
    public Long getRoomId() { return roomId; } public void setRoomId(Long v) { this.roomId=v; }
    public String getContent() { return content; } public void setContent(String v) { this.content=v; }
    public String getType() { return type; } public void setType(String v) { this.type=v; }
}
