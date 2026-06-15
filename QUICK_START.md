# 🚀 Quick Start Guide - Nexus Chat

## What Was Fixed?

### Backend Issues ✅
1. **Missing `/api/chat/users/online` endpoint** - Frontend was calling it but it didn't exist
2. **Missing profile management endpoints** - No way to update user profiles
3. **Missing group chat creation** - Only DMs were supported
4. **Missing message search** - Couldn't search within conversations
5. **Missing message deletion** - No way to delete sent messages
6. **Missing bio field** - User model had no bio support

### Frontend Issues ✅
1. **API calls to non-existent endpoints** - Fixed all API references
2. **Limited UI features** - Added many new interactive elements
3. **Poor error handling** - Now has comprehensive toast notifications
4. **No group chat UI** - Added group creation modal
5. **No search functionality** - Added message search UI
6. **Basic design** - Enhanced with modern dark theme and animations

## New Features Added 🎉

### 1. Group Chats 👥
- Create group channels with multiple members
- See all group members in info panel
- Group-specific UI indicators (# prefix)

### 2. Message Search 🔍
- Search within any chat room
- Find messages by content
- Quick navigation to results

### 3. User Profiles 👤
- View user details with bio
- Update your own profile
- Customizable avatar colors

### 4. Message Management 🗑️
- Delete your own messages
- Real-time deletion sync
- Confirmation dialogs

### 5. Enhanced Online Presence 🟢
- Accurate online/offline status
- Green pulse animation for active users
- Real-time status updates

### 6. Rich UI Elements ✨
- Message reactions (❤️ 😂 👍 🔥 😮)
- Emoji picker with categories
- Typing indicators with animation
- Read receipts (✓ ✓✓ ✓✓)
- Date separators
- Toast notifications
- Smooth transitions

## Running the App

### Option 1: Automated Script (Recommended)
```bash
./start.sh
```
This will:
- Start PostgreSQL
- Create database if needed
- Start Redis
- Start backend
- Install frontend deps if needed
- Start frontend

To stop:
```bash
./stop.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
# Start PostgreSQL
brew services start postgresql

# Create database (first time only)
psql postgres -c "CREATE DATABASE chatapp;"

# Start Redis
brew services start redis

# Start backend
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # first time only
npm start
```

## Testing the App

### 1. Open http://localhost:3000

### 2. Login with Demo Account
- Email: `alice@demo.com`
- Password: `demo123`

### 3. Open Second Browser/Tab (Incognito)
- Email: `bob@demo.com`
- Password: `demo123`

### 4. Try These Features:

#### Start a Direct Message
1. Click "New DM" tab in sidebar
2. Search for a user
3. Click to start chatting

#### Create a Group Chat
1. Click "+" button in sidebar header
2. Enter group name
3. Select 2+ members
4. Click "Create Group"

#### Send Messages
- Type in the input box
- Press Enter or click send
- See typing indicators in real-time
- Hover messages to react

#### Search Messages
1. Click search icon in chat header
2. Type search query
3. See filtered results

#### Update Your Profile
1. Click your avatar in sidebar
2. Update bio and color
3. Save changes

#### Delete a Message
1. Hover over your sent message
2. Click delete icon
3. Confirm deletion

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │  Port 3000
│  (SockJS/STOMP) │
└────────┬────────┘
         │ HTTP + WebSocket
         ▼
┌─────────────────┐
│ Spring Boot API │  Port 8082
│   WebSocket     │
└────┬────────┬───┘
     │        │
     ▼        ▼
┌─────────┐ ┌──────┐
│PostgreSQL│ │Redis │
│Messages  │ │Pub/Sub│
└─────────┘ └──────┘
```

## Tech Stack

**Backend:**
- Java 17
- Spring Boot 3.2
- Spring Security (JWT)
- Spring WebSocket (STOMP)
- Spring Data JPA
- PostgreSQL
- Redis

**Frontend:**
- React 18
- Axios (HTTP)
- SockJS + STOMP.js (WebSocket)
- Modern CSS with animations

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Chat
- `GET /api/chat/rooms` - Get user's chat rooms
- `GET /api/chat/rooms/{roomId}/messages` - Get message history
- `POST /api/chat/rooms/dm/{userId}` - Create/get DM
- `POST /api/chat/rooms/group` - Create group chat
- `GET /api/chat/rooms/{roomId}/messages/search` - Search messages
- `DELETE /api/messages/{messageId}` - Delete message

### Users
- `GET /api/chat/users/search` - Search users
- `GET /api/chat/users/online` - Get online users
- `GET /api/chat/users/{userId}` - Get user profile
- `PUT /api/chat/users/profile` - Update profile

### WebSocket
- `/app/chat.send` - Send message
- `/app/chat.typing` - Typing indicator
- `/topic/room/{roomId}` - Subscribe to room
- `/topic/status` - Subscribe to status updates

## Database Schema

### Users
- id, email, password, username
- avatarColor, bio, status
- createdAt, lastSeen

### ChatRooms
- id, name, type (DIRECT/GROUP)
- createdAt
- members (ManyToMany)

### Messages
- id, content, type
- sender (ManyToOne User)
- room (ManyToOne ChatRoom)
- readStatus, sentAt

## Environment Variables

Edit `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/chatapp
spring.datasource.username=postgres
spring.datasource.password=postgres

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379

# JWT Secret (change in production!)
app.jwt.secret=your-secret-key-here
app.jwt.expiration=86400000
```

## Troubleshooting

### Backend won't start
- Check PostgreSQL: `psql postgres -c '\l'`
- Check Redis: `redis-cli ping`
- Check port 8082: `lsof -i :8082`

### Frontend won't start
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check port 3000: `lsof -i :3000`
- Clear cache: `npm cache clean --force`

### WebSocket not connecting
- Check CORS settings in `SecurityConfig.java`
- Verify WebSocket endpoint: `http://localhost:8082/ws`
- Check browser console for errors

### Messages not sending
- Check WebSocket connection status
- Verify JWT token in localStorage
- Check backend logs: `tail -f backend.log`

## Performance Tips

### For Development
- Use H2 in-memory database for faster startup
- Disable JPA SQL logging: `spring.jpa.show-sql=false`
- Use React DevTools for debugging

### For Production
- Enable database connection pooling
- Configure Redis persistence
- Add Nginx reverse proxy
- Enable gzip compression
- Use Redis clustering for scaling
- Add rate limiting
- Set up monitoring (Prometheus/Grafana)

## Next Steps

Want to add more features? Check `FIXES_AND_ENHANCEMENTS.md` for:
- File sharing
- Voice messages
- Message editing
- User blocking
- Message pinning
- Chat threads
- Push notifications
- And 10+ more ideas!

## Support

Having issues? Check:
1. Backend logs: `tail -f backend.log`
2. Frontend console: Browser DevTools → Console
3. Network tab: Check API calls and responses
4. PostgreSQL: `psql chatapp -c 'SELECT * FROM users;'`
5. Redis: `redis-cli KEYS '*'`

## Demo Video Script

1. Login as Alice → Show modern UI
2. Navigate to "New DM" → Search and start DM with Bob
3. Send messages → Show typing indicators
4. Login as Bob in incognito → Show real-time delivery
5. React to messages → Show emoji reactions
6. Create group → Add multiple users
7. Search messages → Show search functionality
8. Delete message → Show deletion
9. Update profile → Show bio and color
10. Show online status → Logout Bob, see offline

---

**Congratulations! Your chat app is now fully functional with modern features!** 🎉

Questions? Issues? Check the codebase comments for inline documentation.
