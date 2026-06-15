#!/bin/bash

# Complete Automated Test Suite
echo "🧪 Running Complete Test Suite..."
echo "=================================="
echo ""

PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Backend Health
echo "Test 1: Backend Health Check"
if curl -s http://localhost:8082/health | grep -q "OK"; then
    echo -e "${GREEN}✅ PASS${NC} - Backend is healthy"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - Backend is not responding"
    ((FAIL++))
fi
echo ""

# Test 2: Frontend Accessible
echo "Test 2: Frontend Accessibility"
if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
    echo -e "${GREEN}✅ PASS${NC} - Frontend is accessible"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - Frontend is not responding"
    ((FAIL++))
fi
echo ""

# Test 3: PostgreSQL Connection
echo "Test 3: Database Connection"
if psql -U postgres -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} - PostgreSQL is connected"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - PostgreSQL is not accessible"
    ((FAIL++))
fi
echo ""

# Test 4: Database Exists
echo "Test 4: Database Exists"
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw chatapp; then
    echo -e "${GREEN}✅ PASS${NC} - chatapp database exists"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - chatapp database not found"
    ((FAIL++))
fi
echo ""

# Test 5: Redis Connection
echo "Test 5: Redis Connection"
if redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✅ PASS${NC} - Redis is responding"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - Redis is not responding"
    ((FAIL++))
fi
echo ""

# Test 6: Login Endpoint
echo "Test 6: User Authentication"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@demo.com","password":"demo123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✅ PASS${NC} - Login successful, JWT token received"
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - Login failed"
    ((FAIL++))
    TOKEN=""
fi
echo ""

if [ -n "$TOKEN" ]; then
    # Test 7: Get Rooms
    echo "Test 7: Get Chat Rooms"
    ROOMS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/chat/rooms)
    if echo "$ROOMS_RESPONSE" | grep -q "id"; then
        ROOM_COUNT=$(echo $ROOMS_RESPONSE | grep -o '"id"' | wc -l | tr -d ' ')
        echo -e "${GREEN}✅ PASS${NC} - Fetched $ROOM_COUNT room(s)"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - Failed to fetch rooms"
        ((FAIL++))
    fi
    echo ""

    # Test 8: User Search (NEW ENDPOINT)
    echo "Test 8: User Search (NEW)"
    SEARCH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8082/api/chat/users/search?query=bob")
    if echo "$SEARCH_RESPONSE" | grep -q "bob"; then
        echo -e "${GREEN}✅ PASS${NC} - User search working"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - User search failed"
        ((FAIL++))
    fi
    echo ""

    # Test 9: Online Users (NEW ENDPOINT)
    echo "Test 9: Get Online Users (NEW)"
    ONLINE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/chat/users/online)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - Online users endpoint working"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - Online users endpoint failed"
        ((FAIL++))
    fi
    echo ""

    # Test 10: Get User Profile (NEW ENDPOINT)
    echo "Test 10: Get User Profile (NEW)"
    PROFILE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/chat/users/1)
    if echo "$PROFILE_RESPONSE" | grep -q "username"; then
        echo -e "${GREEN}✅ PASS${NC} - User profile endpoint working"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - User profile endpoint failed"
        ((FAIL++))
    fi
    echo ""

    # Test 11: Update Profile (NEW ENDPOINT)
    echo "Test 11: Update Profile (NEW)"
    UPDATE_RESPONSE=$(curl -s -X PUT -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"bio":"Test bio","avatarColor":"#7c6ff7"}' \
      http://localhost:8082/api/chat/users/profile)
    if echo "$UPDATE_RESPONSE" | grep -q "bio"; then
        echo -e "${GREEN}✅ PASS${NC} - Profile update working"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - Profile update failed"
        ((FAIL++))
    fi
    echo ""

    # Test 12: Create DM
    echo "Test 12: Create Direct Message"
    DM_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
      http://localhost:8082/api/chat/rooms/dm/2)
    if echo "$DM_RESPONSE" | grep -q "id"; then
        echo -e "${GREEN}✅ PASS${NC} - DM creation working"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - DM creation failed"
        ((FAIL++))
    fi
    echo ""

    # Test 13: Check if users table has bio column
    echo "Test 13: Database Schema - Bio Field"
    if psql -U postgres chatapp -c "\d users" 2>/dev/null | grep -q "bio"; then
        echo -e "${GREEN}✅ PASS${NC} - Bio field exists in users table"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - Bio field missing from users table"
        ((FAIL++))
    fi
    echo ""

    # Test 14: Check demo users
    echo "Test 14: Demo Users in Database"
    USER_COUNT=$(psql -U postgres chatapp -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    if [ "$USER_COUNT" -ge 5 ]; then
        echo -e "${GREEN}✅ PASS${NC} - Found $USER_COUNT users (expected ≥5)"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠️  WARN${NC} - Only $USER_COUNT users found (expected ≥5)"
        ((FAIL++))
    fi
    echo ""

else
    echo -e "${YELLOW}⚠️  SKIPPING${NC} - Tests 7-14 skipped (no valid token)"
    echo ""
fi

# Test 15: WebSocket Endpoint
echo "Test 15: WebSocket Endpoint"
if curl -s -I http://localhost:8082/ws | grep -q "426"; then
    echo -e "${GREEN}✅ PASS${NC} - WebSocket endpoint accessible (426 = upgrade required, correct!)"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} - WebSocket endpoint not accessible"
    ((FAIL++))
fi
echo ""

# Results
echo "=================================="
echo "📊 TEST RESULTS:"
echo "=================================="
TOTAL=$((PASS + FAIL))
echo -e "${GREEN}✅ Passed: $PASS/$TOTAL${NC}"
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}❌ Failed: $FAIL/$TOTAL${NC}"
fi
echo ""

# Success rate
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASS/$TOTAL)*100}")
echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your application is fully functional!${NC}"
    echo ""
    echo "✨ Quick Start:"
    echo "   1. Open http://localhost:3000"
    echo "   2. Login: alice@demo.com / demo123"
    echo "   3. Start chatting!"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check the output above for details.${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - Make sure backend is running: ./mvnw spring-boot:run"
    echo "   - Make sure frontend is running: cd frontend && npm start"
    echo "   - Check PostgreSQL: brew services start postgresql"
    echo "   - Check Redis: brew services start redis"
    exit 1
fi
