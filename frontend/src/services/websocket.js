import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;
let subscriptions = {};

export const connectWebSocket = (token, onMessage, onTyping, onStatusChange) => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8082/ws"),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,

    onConnect: () => {
      console.log("✅ WebSocket connected");
      stompClient.subscribe("/topic/status", (msg) => {
        const data = JSON.parse(msg.body);
        console.log("📡 Status update:", data);
        if (data.type === "USER_STATUS" && onStatusChange) onStatusChange(data.payload);
      });
    },

    onStompError: (frame) => console.error("❌ STOMP error", frame),
    onDisconnect: () => console.log("🔌 WebSocket disconnected"),
  });

  stompClient.activate();
  return stompClient;
};

export const subscribeToRoom = (roomId, onMessage, onTyping) => {
  const doSub = () => {
    if (subscriptions[roomId]) {
      try { subscriptions[roomId].unsubscribe(); } catch(e) {}
    }
    console.log("📬 Subscribing to room", roomId);
    subscriptions[roomId] = stompClient.subscribe(
      `/topic/room/${roomId}`,
      (msg) => {
        console.log("📨 Raw message received:", msg.body);
        const data = JSON.parse(msg.body);
        console.log("📨 Parsed:", data);
        if (data.type === "MESSAGE" && onMessage) onMessage(data.payload);
        if (data.type === "TYPING" && onTyping) onTyping(data.payload);
      }
    );
  };

  if (stompClient?.connected) {
    doSub();
  } else {
    console.log("⏳ WebSocket not ready, waiting...");
    const check = setInterval(() => {
      if (stompClient?.connected) {
        clearInterval(check);
        doSub();
      }
    }, 200);
    setTimeout(() => clearInterval(check), 10000);
  }
};

export const sendWebSocketMessage = (roomId, content) => {
  console.log("📤 Sending message to room", roomId, ":", content);
  console.log("📤 Connected?", stompClient?.connected);
  if (!stompClient?.connected) {
    console.error("❌ Not connected!");
    return;
  }
  stompClient.publish({
    destination: "/app/chat.send",
    body: JSON.stringify({ roomId, content, type: "TEXT" }),
  });
};

export const sendTypingIndicator = (roomId, isTyping) => {
  if (!stompClient?.connected) return;
  stompClient.publish({
    destination: "/app/chat.typing",
    body: JSON.stringify({ roomId, isTyping }),
  });
};

export const disconnectWebSocket = () => {
  subscriptions = {};
  stompClient?.deactivate();
};
