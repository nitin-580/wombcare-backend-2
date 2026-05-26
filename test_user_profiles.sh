#!/bin/bash

# Configuration
API_URL=${API_URL:-"http://localhost:3001"}
ADMIN_KEY="nitinisacoderandstudent"
ID_SUFFIX=$(date +%s)

echo "-----------------------------------"
echo "Womb Care User Profiles & Tracking API Testing"
echo "-----------------------------------"

# 1. Create Profile with Onboarding / Cycle fields
echo -e "\n[1] Testing Create Profile with Onboarding details..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ishika Sharma",
    "email": "ishika_'$ID_SUFFIX'@wombcare.com",
    "age": 26,
    "activePlan": "Premium 90-Day Hormonal Wellness",
    "planStatus": "Active",
    "waterIntake": 5,
    "targetWater": 8,
    "caloriesTarget": 1800,
    "proteinTarget": 80,
    "symptoms": ["Acne", "Mood swings", "Fatigue"],
    "bmi": 24.2,
    "wellnessScore": 82,
    "personalNotes": "Patient has reported mild fatigue during the last 3 cycles.",
    "doctorNote": "Continue hormonal wellness plan for next 30 days.",
    "cycleDay": 1,
    "cycleLength": 28,
    "nextPeriodDate": "2026-06-20",
    "isPeriodTrackerEnabled": true,
    "mood": "happy"
  }')

echo "$CREATE_RESPONSE" | jq .

PROFILE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')

if [ "$PROFILE_ID" != "null" ] && [ -n "$PROFILE_ID" ]; then
  # 2. Get Profile
  echo -e "\n[2] Testing Get Profile..."
  curl -s -X GET "$API_URL/api/profiles/$PROFILE_ID" | jq .

  # 3. Simulate Day Transition
  # We will manually set the profile's lastSeen to yesterday
  YESTERDAY=$(date -v-1d -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -d "yesterday" -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "2026-05-24T12:00:00Z")
  echo -e "\n[3] Simulating Day Transition (Updating lastSeen to yesterday: $YESTERDAY)..."
  
  UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/api/profiles/$PROFILE_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "lastSeen": "'$YESTERDAY'"
    }')
  echo "$UPDATE_RESPONSE" | jq .

  # 4. Trigger Reset and Period Increment (Fetch Profile today)
  echo -e "\n[4] Triggering Daily Reset / Cycle Day Increment (Fetching Profile Today)..."
  GET_TODAY_RESPONSE=$(curl -s -X GET "$API_URL/api/profiles/$PROFILE_ID")
  echo "$GET_TODAY_RESPONSE" | jq .
  
  # Check if waterIntake reset to 0, mood reset, and cycleDay advanced to 2
  NEW_WATER=$(echo "$GET_TODAY_RESPONSE" | jq -r '.data.waterIntake')
  NEW_CYCLE_DAY=$(echo "$GET_TODAY_RESPONSE" | jq -r '.data.cycleDay')
  NEW_MOOD=$(echo "$GET_TODAY_RESPONSE" | jq -r '.data.mood')
  
  echo "Result of transition:"
  echo "  - waterIntake (should be 0): $NEW_WATER"
  echo "  - cycleDay (should be advanced): $NEW_CYCLE_DAY"
  echo "  - mood (should be null/empty): $NEW_MOOD"

  # 5. Fetch History Section
  echo -e "\n[5] Fetching User Tracking History Section..."
  curl -s -X GET "$API_URL/api/profiles/$PROFILE_ID/history" | jq .

else
  echo "Failed to create profile, skipping other tests."
fi

echo -e "\n-----------------------------------"
echo "Testing Completed"
echo "-----------------------------------"
