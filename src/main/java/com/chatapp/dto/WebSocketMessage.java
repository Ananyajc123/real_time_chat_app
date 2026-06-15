package com.chatapp.dto;
public class WebSocketMessage {
    public String type; public Object payload;
    public WebSocketMessage() {}
    public WebSocketMessage(String type, Object payload) { this.type=type; this.payload=payload; }
}
