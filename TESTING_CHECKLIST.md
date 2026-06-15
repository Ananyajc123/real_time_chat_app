# ✅ Complete Testing Checklist

## How to Verify Your Chat App is Working Correctly

### Prerequisites Check ☑️

Run these commands first:

```bash
# 1. Check if backend is running
curl http://localhost:8082/health
# Expected: "OK"

# 2. Check if frontend is running  
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# 3. Check PostgreSQL
psql -U postgres -c "\l" | grep chatapp
# Expected: chatapp database listed

# 4. Check Redis
redis-cli ping
# Expected: PONG
```

---

## 🧪 Manual Testing Guide

### Test 1: Login & Authentication ✅

1. Open browser: **http://localhost:3000**
2. You should see a **dark-themed login page**
3. Enter credentials:
   - Email: `alice@demo.com`
   - Password: `demo123`
4. Click "Sign in →"

**Expected Result:**
- ✅ No errors in browser console (F12)
- ✅ You're redirected to chat interface
- ✅ You see your username "alice" in top-left
- ✅ Green "● online" indicator appears
- ✅ Sidebar shows existing chats

**If it fails:**
- Check browser console for errors
- Verify backend is running on port 8082
- Check if JWT token is in localStorage (F12 → Application → Local Storage)

---

### Test 2: Real-Time Messaging ✅

1. **Window 1**: Already logged in as Alice
2. **Window 2**: Open **incognito/private window**
3. Login as Bob:
   - Email: `bob@demo.com`
   - Password: `demo123`

4. **In Window 1 (Alice)**:
   - Click "New DM" tab
   - Search for "bob"
   - Click on bob's name to start chat

5. **Send message from Alice**: Type "Hello Bob!" and press Enter

**Expected Result:**
- ✅ Message appears instantly in Alice's window with purple bubble
- ✅ Message appears instantly in Bob's window with gray bubble
- ✅ Alice sees "✓" (sent) status
- ✅ Typing indicator shows when someone types
- ✅ No page refresh needed

**If it fails:**
- Check browser console in both windows
- Verify WebSocket connection (Console should show "✅ WebSocket connected")
- Check backend logs for WebSocket errors

---

### Test 3: Group Chat ✅

1. **As Alice**, click the **refresh button** (↺) in sidebar
2. Look for "# General 💬" group chat
3. Click on it to open
4. Send a message: "Hello everyone!"

5. **In Bob's window**, click on "# General 💬"

**Expected Result:**
- ✅ Alice's message appears in the group
- ✅ Bob sees the same message in real-time
- ✅ All 5 members are shown in group info panel
- ✅ Group has "#" prefix in room list

---

### Test 4: Create New Group (NEW FEATURE) ✅

1. **As Alice**, look for a **"+" button** or "Create Group" option
2. If using the original App.js, groups already exist from seed data
3. Check that the "General" group shows all 5 members:
   - alice, bob, charlie, diana, eve

**Expected Result:**
- ✅ Group appears in sidebar with # prefix
- ✅ Members list visible in info panel
- ✅ Can send messages to group

---

### Test 5: Typing Indicators ✅

1. **In Alice's window**: Click on the chat with Bob
2. **In Bob's window**: Start typing (but don't send)

**Expected Result:**
- ✅ Alice sees "bob is typing..." with animated dots (···)
- ✅ Indicator disappears 2 seconds after Bob stops typing
- ✅ Works in both directions

---

### Test 6: Online Status (FIXED) ✅

1. **Keep Alice logged in** in Window 1
2. **Login as Bob** in Window 2
3. **In Alice's window**: Check the user list or DM with Bob

**Expected Result:**
- ✅ Bob shows green dot (●) when online
- ✅ Status updates in real-time
- ✅ Close Bob's window → Alice sees Bob go offline
- ✅ Reopen Bob → Alice sees Bob come online again

**Test the NEW endpoint:**
```bash
# Get Alice's token from browser console: localStorage.getItem('token')
TOKEN="<paste_token_here>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/chat/users/online
```
Expected: List of currently online users

---

### Test 7: User Search (NEW FEATURE) ✅

1. **As Alice**, click **"New DM"** tab in sidebar
2. In search box, type: "charlie"

**Expected Result:**
- ✅ Search results appear as you type
- ✅ Shows charlie with avatar and email
- ✅ Click to start new DM
- ✅ New chat appears in sidebar

**Test the API directly:**
```bash
TOKEN="<your_token>"
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8082/api/chat/users/search?query=charlie"
```
Expected: `[{"id":3,"username":"charlie",...}]`

---

### Test 8: Message Search (NEW FEATURE) ✅

**Note:** This requires the enhanced App.js with search UI.

1. Send several messages in a chat
2. Look for **search icon** (🔍) in chat header
3. Enter search term
4. Results should highlight matching messages

**Test the API:**
```bash
TOKEN="<your_token>"
ROOM_ID=1  # Use actual room ID from /api/chat/rooms
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8082/api/chat/rooms/$ROOM_ID/messages/search?query=hello"
```

---

### Test 9: Emoji Reactions ✅

1. Send a message as Alice
2. **Hover over the message**
3. Quick react bar should appear with: ❤️ 😂 👍 🔥 😮

**Expected Result:**
- ✅ Action bar appears on hover
- ✅ Click emoji adds reaction
- ✅ Counter shows "❤️ 1"
- ✅ Can react multiple times

---

### Test 10: Emoji Picker ✅

1. In message input area, look for emoji button (◎ or 😊)
2. Click to open emoji picker
3. Pick an emoji
4. Emoji inserts into message

**Expected Result:**
- ✅ Picker opens with categorized emojis
- ✅ Can switch between categories
- ✅ Click emoji → inserts in message
- ✅ Click outside → picker closes

---

### Test 11: Read Receipts ✅

1. **Alice sends message** to Bob
2. Alice should see: **"✓"** (sent)
3. **Bob opens the chat** (loads messages)
4. Alice should see: **"✓✓"** in purple (read)

**Expected Result:**
- ✅ Single check mark = sent
- ✅ Double check mark = delivered  
- ✅ Purple double check mark = read
- ✅ Updates in real-time

---

### Test 12: Message Deletion (NEW FEATURE) ✅

**Note:** Requires enhanced UI or API test.

1. **Alice sends message**: "Test delete"
2. **Hover over message** → Delete icon appears
3. Click delete → Confirmation dialog
4. Confirm deletion

**Test the API:**
```bash
TOKEN="<your_token>"
MESSAGE_ID=123  # Get from a message you sent
curl -X DELETE -H "Authorization: Bearer $TOKEN" "http://localhost:8082/api/messages/$MESSAGE_ID"
```

Expected: 200 OK

**Verify:**
- ✅ Message disappears from both windows
- ✅ Can only delete own messages
- ✅ Gets 403 error if trying to delete someone else's message

---

### Test 13: User Profile (NEW FEATURE) ✅

**Test the API:**
```bash
TOKEN="<your_token>"

# Get Alice's profile
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8082/api/chat/users/1"

# Update profile
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"I love chatting!","avatarColor":"#7c6ff7"}' \
  http://localhost:8082/api/chat/users/profile
```

Expected: Profile data with bio field

---

### Test 14: Date Separators ✅

1. Open any chat with history
2. Scroll through messages

**Expected Result:**
- ✅ Messages grouped by date
- ✅ "Today" separator for today's messages
- ✅ "Yesterday" for yesterday
- ✅ Date format (e.g., "Monday, Jun 5") for older messages

---

### Test 15: Responsive Design ✅

1. Resize browser window
2. Test on different screen sizes
3. Use browser DevTools → Toggle device toolbar

**Expected Result:**
- ✅ Layout adapts to screen size
- ✅ Sidebar collapsible on mobile
- ✅ Messages stack properly
- ✅ No horizontal scroll

---

## 🔍 Backend API Testing

### Test All Endpoints with cURL

```bash
# Save your token after login
TOKEN=$(curl -s -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@demo.com","password":"demo123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 1. ✅ Get rooms
curl -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/chat/rooms

# 2. ✅ Get messages (replace ROOM_ID)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/chat/rooms/1/messages?limit=50

# 3. ✅ Search users (NEW)
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8082/api/chat/users/search?query=bob"

# 4. ✅ Get online users (NEW)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/chat/users/online

# 5. ✅ Get user profile (NEW)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/chat/users/2

# 6. ✅ Update profile (NEW)
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Updated bio","avatarColor":"#3dd68c"}' \
  http://localhost:8082/api/chat/users/profile

# 7. ✅ Search messages in room (NEW)
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8082/api/chat/rooms/1/messages/search?query=hello"

# 8. ✅ Create DM
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:8082/api/chat/rooms/dm/3

# 9. ✅ Create group (NEW)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group","memberIds":[1,2,3]}' \
  http://localhost:8082/api/chat/rooms/group
```

---

## 🐛 Debugging Checklist

### If Backend Fails:

```bash
# Check if backend is running
lsof -i :8082

# Check backend logs
tail -f backend.log  # if using start.sh

# Check database connection
psql -U postgres chatapp -c "SELECT * FROM users LIMIT 5;"

# Check Redis
redis-cli KEYS '*'

# Restart backend
pkill -f spring-boot
./mvnw spring-boot:run
```

### If Frontend Fails:

```bash
# Check if frontend is running
lsof -i :3000

# Check for errors
# Open browser console (F12) and check for:
# - Network errors (Network tab)
# - Console errors (Console tab)
# - WebSocket connection status

# Clear cache and restart
cd frontend
rm -rf node_modules
npm install
npm start
```

### Browser Console Checks:

Press **F12** and check for these messages:

**Success indicators:**
- ✅ "✅ WebSocket connected"
- ✅ "📬 Subscribing to room X"
- ✅ "📨 Parsed: {type: 'MESSAGE', ...}"
- ✅ No red error messages

**Problem indicators:**
- ❌ "❌ STOMP error"
- ❌ "❌ Not connected!"
- ❌ 404 errors on API calls
- ❌ CORS errors

---

## 📊 Performance Testing

### Load Test (Optional):

```bash
# Install apache bench
brew install apache2

# Test login endpoint
ab -n 100 -c 10 -p login.json -T application/json \
  http://localhost:8082/api/auth/login

# Create login.json:
echo '{"email":"alice@demo.com","password":"demo123"}' > login.json
```

---

## ✅ Final Verification Checklist

Mark each as complete:

**Backend:**
- [ ] Port 8082 responding
- [ ] Health endpoint returns OK
- [ ] Login returns JWT token
- [ ] All 15+ endpoints accessible
- [ ] Database queries working
- [ ] Redis pub/sub working
- [ ] WebSocket connections stable

**Frontend:**
- [ ] Port 3000 accessible
- [ ] Login page loads
- [ ] Chat interface renders
- [ ] No console errors
- [ ] WebSocket connects
- [ ] Messages send/receive
- [ ] Real-time updates work

**Features:**
- [ ] User authentication
- [ ] Direct messages
- [ ] Group chats
- [ ] Typing indicators
- [ ] Online status
- [ ] Read receipts
- [ ] Emoji reactions
- [ ] User search (NEW)
- [ ] Message search (NEW)
- [ ] Profile management (NEW)

**Real-Time:**
- [ ] Messages arrive instantly
- [ ] Typing shows in <1 second
- [ ] Status updates immediately
- [ ] Multiple tabs sync correctly

---

## 🎯 Expected Results Summary

If everything is working correctly, you should see:

1. ✅ **Login works** - JWT token received
2. ✅ **Chat loads** - Rooms displayed
3. ✅ **Messages send** - Instant delivery
4. ✅ **Real-time works** - Updates without refresh
5. ✅ **WebSocket stable** - No disconnections
6. ✅ **All APIs respond** - No 404 errors
7. ✅ **Search works** - Users and messages found
8. ✅ **Status accurate** - Online/offline correct
9. ✅ **UI smooth** - Animations work
10. ✅ **No errors** - Clean console

---

## 📞 Quick Health Check Script

Save this as `health-check.sh`:

```bash
#!/bin/bash

echo "🏥 Health Check Starting..."

# Backend
if curl -s http://localhost:8082/health | grep -q "OK"; then
    echo "✅ Backend: HEALTHY"
else
    echo "❌ Backend: DOWN"
fi

# Frontend
if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
    echo "✅ Frontend: HEALTHY"
else
    echo "❌ Frontend: DOWN"
fi

# PostgreSQL
if psql -U postgres -c '\q' 2>/dev/null; then
    echo "✅ PostgreSQL: HEALTHY"
else
    echo "❌ PostgreSQL: DOWN"
fi

# Redis
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis: HEALTHY"
else
    echo "❌ Redis: DOWN"
fi

echo ""
echo "✨ Health Check Complete!"
```

Run it: `chmod +x health-check.sh && ./health-check.sh`

---

## 🎊 Success Criteria

**Your app is fully functional if:**
- ✅ All health checks pass
- ✅ Login works without errors
- ✅ Can send and receive messages instantly
- ✅ WebSocket stays connected
- ✅ Both users see each other's messages
- ✅ Typing indicators work
- ✅ No errors in browser console
- ✅ All API endpoints return valid data

**You can now confidently demo your application!** 🚀
