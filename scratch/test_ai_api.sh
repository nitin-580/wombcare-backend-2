#!/bin/bash

echo "🚀 Starting fresh WombCare Backend on Port 8082 via npx..."
# Start server in background with port 8082
PORT=8082 npx tsx src/server.ts > /tmp/wombcare_test.log 2>&1 &
SERVER_PID=$!

# Wait for server to boot up
sleep 3.5

echo "🌸 Sending Test Message to WombCare AI: 'PCOD weight kaise kam karein?'..."
RESPONSE=$(curl -s -X POST http://localhost:8082/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "PCOD weight kaise kam karein?"}
    ],
    "language": "hinglish"
  }')

echo -e "\n🌟 AI Response:"
echo "$RESPONSE"

# Clean up backend process
kill $SERVER_PID
echo -e "\n✅ Test Completed. Server shut down."
