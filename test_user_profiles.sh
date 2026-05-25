#!/bin/bash

# Configuration
API_URL="http://localhost:3001"
ADMIN_KEY="nitinisacoderandstudent"
ID_SUFFIX=$(date +%s)

echo "-----------------------------------"
echo "Womb Care User Profiles API Testing"
echo "-----------------------------------"

# 1. Create Profile
echo -e "\n[1] Testing Create Profile..."
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
    "doctorNote": "Continue hormonal wellness plan for next 30 days."
  }')

echo "$CREATE_RESPONSE" | jq .

PROFILE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')

if [ "$PROFILE_ID" != "null" ]; then
  # 2. Get Profile
  echo -e "\n[2] Testing Get Profile..."
  curl -s -X GET "$API_URL/api/profiles/$PROFILE_ID" | jq .

  # 3. Update Profile (Individual fields)
  echo -e "\n[3] Testing Update Profile (Water Intake)..."
  curl -s -X PATCH "$API_URL/api/profiles/$PROFILE_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "waterIntake": 6,
      "lastSeen": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }' | jq .

  # 4. Update Profile (Symptoms)
  echo -e "\n[4] Testing Update Profile (Symptoms)..."
  curl -s -X PATCH "$API_URL/api/profiles/$PROFILE_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "symptoms": ["Acne", "Mood swings"]
    }' | jq .
else
  echo "Failed to create profile, skipping other tests."
fi

echo -e "\n-----------------------------------"
echo "Testing Completed"
echo "-----------------------------------"
