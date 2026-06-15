# 🔧 Message Sending Issue - FIXED!

## Problem Found
The WebSocket connection was not passing JWT authentication properly.
Backend was throwing: `NullPointerException: Cannot invoke "java.security.Principal.getName()"`

## Solution Applied
Added JWT authentication interceptor to WebSocket configuration to properly authenticate users.

## How to Test the Fix

### 1. Refresh Both Browser Windows
- **Window 1 (Alice)**: Press `Ctrl+Shift+R` or `Cmd+Shift+R` (hard refresh)
- **Window 2 (Bob)**: Press `Ctrl+Shift+R` or `Cmd+Shift+R` (hard refresh)

### 2. Login Again
- **Window 1**: Login as alice@demo.com / demo123
- **Window 2**: Login as bob@demo.com / demo123

### 3. Check Browser Console (F12)
You should now see:
```
✅ WebSocket connected
📬 Subscribing to room X
```

### 4. Send a Test Message
- In Alice's window, click on "bob" chat
- Type: "Hello Bob! Can you see this?"
- Press Enter

### 5. Expected Results
✅ Message appears in Alice's window immediately (purple bubble on right)
✅ Message appears in Bob's window immediately (gray bubble on left)
✅ No errors in browser console
✅ Backend logs show no NullPointerException

### 6. If Still Not Working

**Check Backend Logs:**
```bash
# Look for errors
tail -20 logs from terminal where backend is running
```

**Check Frontend Console:**
Open browser console (F12) and look for:
- ❌ "❌ Not connected!" - WebSocket issue
- ❌ Network errors - Connection issue
- ✅ "📤 Sending message..." - Message sending
- ✅ "📨 Raw message received" - Message receiving

**Troubleshooting Commands:**
```bash
# 1. Check if backend restarted
curl http://localhost:8082/health
# Should return: OK

# 2. Test login
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@demo.com","password":"demo123"}'
# Should return JWT token

# 3. Check WebSocket endpoint
curl http://localhost:8082/ws
# Should return: "Welcome to SockJS!"
```

## What Was Changed

### File: WebSocketConfig.java
**Added:**
- JWT authentication channel interceptor
- Proper user authentication from Bearer token
- Token validation before allowing WebSocket messages

### File: JwtUtil.java  
**Added:**
- Overloaded `validateToken(String token, String username)` method
- Allows validating token without UserDetails object

## Technical Details

**Before:**
```java
// Principal was null because JWT wasn't validated
public void sendMessage(@Payload SendMessageRequest request, Principal principal) {
    chatService.sendMessage(request, principal.getName()); // ❌ NullPointerException
}
```

**After:**
```java
// JWT token is now validated during WebSocket CONNECT
// Principal is populated with authenticated user email
configureClientInboundChannel() {
    // Intercepts CONNECT command
    // Extracts JWT from Authorization header
    // Validates token and sets user principal ✅
}
```

## Success Indicators

When working correctly, you'll see:
1. ✅ Login successful → JWT token stored
2. ✅ WebSocket connects → "WebSocket connected" in console
3. ✅ Can subscribe to rooms → "Subscribing to room X"
4. ✅ Messages send → Input clears, message appears
5. ✅ Messages receive → Other window updates instantly
6. ✅ Typing indicator works → "X is typing..." appears
7. ✅ No backend errors → Clean console logs

## Still Having Issues?

If messages still don't send after trying above:

1. **Clear browser cache completely**
2. **Logout and login again**
3. **Check if you're in the same room** (both users must be in same chat)
4. **Try the General group chat** (easier to test with existing group)

Or run the automated test:
```bash
./test-all.sh
```

Should now pass all 15 tests! ✅
