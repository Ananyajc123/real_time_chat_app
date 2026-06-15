# 🚀 How to Run Nexus Chat App

## Prerequisites
- Java 17+
- Maven (or use the included `./mvnw`)
- Node.js 16+
- PostgreSQL
- Redis

---

## Step 1 — PostgreSQL Setup

```bash
psql postgres -c "CREATE DATABASE chatapp;"
```

---

## Step 2 — Redis

**macOS:**
```bash
brew services start redis
```

**Linux:**
```bash
sudo systemctl start redis
# or
redis-server
```

**Windows:** Use [Redis for Windows](https://github.com/microsboftarchive/redis/releases) or WSL.

---

## Step 3 — Configure Backend

Edit `src/main/resources/application.properties` if needed:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/chatapp
spring.datasource.username=postgres
spring.datasource.password=          # <-- set your password if any
spring.redis.host=localhost
spring.redis.port=6379
server.port=8082
```

---

## Step 4 — Start Backend

```bash
# From the chat-app root directory:
./mvnw spring-boot:run
```

Backend runs at: http://localhost:8082

---

## Step 5 — Start Frontend

```bash
cd frontend
npm install       # only needed first time
npm start
```

Frontend runs at: http://localhost:3000

---

## Demo Accounts

| Email            | Password |
|------------------|----------|
| alice@demo.com   | demo123  |
| bob@demo.com     | demo123  |
| charlie@demo.com | demo123  |
| diana@demo.com   | demo123  |
| eve@demo.com     | demo123  |

Open two browser tabs (or incognito) to chat between users in real time!

---

## New Features in This Version

- ✦ **Redesigned UI** — dark editorial aesthetic with Syne + DM Sans + DM Mono fonts
- ✦ **Emoji picker** — click ◎ in the input bar to pick emoji
- ✦ **Quick reactions** — hover any message to react with ❤️ 😂 👍 🔥 😮
- ✦ **Date dividers** — messages grouped by Today / Yesterday / date
- ✦ **Typing animation** — animated dots when someone is typing
- ✦ **Toast notifications** — feedback on actions
- ✦ **Conversation filter** — search/filter your room list in the sidebar
- ✦ **New DM tab** — dedicated tab for finding and starting new conversations
- ✦ **Textarea input** — multi-line messages with Shift+Enter
- ✦ **Show/hide password** — toggle on the login form
- ✦ **Read receipts** — ✓ sent, ✓✓ delivered, ✓✓ (purple) read
- ✦ **Online pulse indicator** — animated green dot for active users
