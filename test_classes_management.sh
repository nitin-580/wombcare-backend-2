#!/bin/bash

# Configuration
API_URL=${API_URL:-"http://localhost:3001"}
ADMIN_KEY="nitinisacoderandstudent"
USER_ID="c2bdd703-aed9-48bc-a754-77a925d66138"

echo "-----------------------------------"
echo "Womb Care Classes Management API Testing"
echo "-----------------------------------"

# 1. Fetch Categories (Triggers auto-seeding if empty)
echo -e "\n[1] Testing Fetch Categories..."
CATEGORIES_RESPONSE=$(curl -s -X GET "$API_URL/api/classes/categories")
echo "$CATEGORIES_RESPONSE" | jq .

CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r '.data[0].id')
echo "Selected Category ID: $CATEGORY_ID"

if [ "$CATEGORY_ID" != "null" ] && [ -n "$CATEGORY_ID" ]; then

  # 2. Create Live Class as Admin (Link 1 placement target)
  echo -e "\n[2] Testing Admin: Create Live Class (Link 1 target)..."
  CREATE_LIVE_RESPONSE=$(curl -s -X POST "$API_URL/api/classes" \
    -H "x-admin-api-key: $ADMIN_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "PCOS Hormonal Yoga Flow",
      "description": "A live interactive yoga session aimed at correcting PCOS symptoms and balancing hormones.",
      "type": "live",
      "thumbnailUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
      "videoUrl": "https://www.youtube.com/watch?v=s2y98c6q1z4",
      "googleMeetLink": "https://meet.google.com/abc-defg-hij",
      "scheduledAt": "2026-06-01T10:00:00Z",
      "instructorName": "Dr. Aaradhya Sharma",
      "duration": 45,
      "categoryId": "'$CATEGORY_ID'",
      "isFeatured": true,
      "isActive": true,
      "tags": ["yoga", "pcos", "live"]
    }')
  echo "$CREATE_LIVE_RESPONSE" | jq .
  
  LIVE_CLASS_ID=$(echo "$CREATE_LIVE_RESPONSE" | jq -r '.data.id')
  YOUTUBE_ID=$(echo "$CREATE_LIVE_RESPONSE" | jq -r '.data.youtubeVideoId')
  echo "Created Live Class ID: $LIVE_CLASS_ID (Extracted YouTube ID: $YOUTUBE_ID)"

  # 3. Create Recorded Class as Admin (Link 2 placement target)
  echo -e "\n[3] Testing Admin: Create Recorded Class (Link 2 target)..."
  CREATE_REC_RESPONSE=$(curl -s -X POST "$API_URL/api/classes" \
    -H "x-admin-api-key: $ADMIN_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "10-Minute Morning PCOS Meditation",
      "description": "Calm your nervous system and support healthy cortisol levels with this daily morning meditation.",
      "type": "recorded",
      "thumbnailUrl": "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
      "videoUrl": "https://youtu.be/m3-O8BY3TQI",
      "instructorName": "Dr. Aaradhya Sharma",
      "duration": 10,
      "categoryId": "'$CATEGORY_ID'",
      "isFeatured": false,
      "isActive": true,
      "tags": ["meditation", "stress", "morning"]
    }')
  echo "$CREATE_REC_RESPONSE" | jq .
  
  REC_CLASS_ID=$(echo "$CREATE_REC_RESPONSE" | jq -r '.data.id')

  # 4. Fetch Placements & Configure placements
  echo -e "\n[4] Testing Fetch Placements..."
  PLACEMENTS_RESPONSE=$(curl -s -X GET "$API_URL/api/classes/placements")
  echo "$PLACEMENTS_RESPONSE" | jq .
  
  PLACEMENT_1_ID=$(echo "$PLACEMENTS_RESPONSE" | jq -r '.data[] | select(.label=="Link 1") | .id')
  PLACEMENT_2_ID=$(echo "$PLACEMENTS_RESPONSE" | jq -r '.data[] | select(.label=="Link 2") | .id')

  if [ -n "$PLACEMENT_1_ID" ] && [ "$PLACEMENT_1_ID" != "null" ]; then
    echo -e "\n[4.1] Testing Update Placement (Link 1 -> Live Class ID)..."
    curl -s -X PATCH "$API_URL/api/classes/placements/$PLACEMENT_1_ID" \
      -H "x-admin-api-key: $ADMIN_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "classId": "'$LIVE_CLASS_ID'",
        "isActive": true
      }' | jq .
  fi

  if [ -n "$PLACEMENT_2_ID" ] && [ "$PLACEMENT_2_ID" != "null" ]; then
    echo -e "\n[4.2] Testing Update Placement (Link 2 -> Recorded Class ID)..."
    curl -s -X PATCH "$API_URL/api/classes/placements/$PLACEMENT_2_ID" \
      -H "x-admin-api-key: $ADMIN_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "classId": "'$REC_CLASS_ID'",
        "isActive": true
      }' | jq .
  fi

  # 5. Record User Attendance (User joins live Google Meet)
  echo -e "\n[5] Testing User: Join Live Google Meet Session..."
  curl -s -X POST "$API_URL/api/classes/attendance" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'",
      "classId": "'$LIVE_CLASS_ID'",
      "interactionJoined": true
    }' | jq .

  # 6. Record User Attendance (User watches recorded class - 50% watched)
  echo -e "\n[6] Testing User: Watch Recorded Session (50% complete)..."
  curl -s -X POST "$API_URL/api/classes/attendance" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'",
      "classId": "'$REC_CLASS_ID'",
      "watchDuration": 300
    }' | jq .

  # 7. Record User Attendance (User watches recorded class - 90% watched, auto-completing session!)
  echo -e "\n[7] Testing User: Watch Recorded Session (90% complete - triggers auto-completion)..."
  curl -s -X POST "$API_URL/api/classes/attendance" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'",
      "classId": "'$REC_CLASS_ID'",
      "watchDuration": 540
    }' | jq .

  # 8. Retrieve User Class History, Streaks, Timeline
  echo -e "\n[8] Testing User: Retrieve Class History, Streaks, and Wellness Progress Timeline..."
  curl -s -X GET "$API_URL/api/classes/history/$USER_ID" | jq .

  # 9. Get Admin Analytics
  echo -e "\n[9] Testing Admin: Get Wellness Class Analytics..."
  curl -s -X GET "$API_URL/api/classes/analytics" \
    -H "x-admin-api-key: $ADMIN_KEY" | jq .

else
  echo "Failed to get category ID, skipping dependant tests."
fi

echo -e "\n-----------------------------------"
echo "Testing Completed"
echo "-----------------------------------"
