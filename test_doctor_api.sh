#!/bin/bash

# Configuration
API_URL="http://localhost:3001"
DOCTOR_EMAIL="dr.test_$(date +%s)@example.com"
DOCTOR_PASSWORD="Password123!"

echo "-----------------------------------"
echo "Doctor API Testing Suite"
echo "-----------------------------------"

# 1. Signup Doctor
echo -e "\n[1] Testing Doctor Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/api/doctors/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test Patient",
    "email": "'"$DOCTOR_EMAIL"'",
    "password": "'"$DOCTOR_PASSWORD"'",
    "phone": "+919988776655",
    "specialization": "Gynecology",
    "credentials": "MBBS, MD"
  }')
echo $SIGNUP_RESPONSE | jq .

# 2. Login Doctor
echo -e "\n[2] Testing Doctor Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/doctors/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$DOCTOR_EMAIL"'",
    "password": "'"$DOCTOR_PASSWORD"'"
  }')
echo $LOGIN_RESPONSE | jq .

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // empty')

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  # 3. Get Profile
  echo -e "\n[3] Testing Get Profile..."
  curl -s -X GET "$API_URL/api/doctors/profile" \
    -H "Authorization: Bearer $TOKEN" | jq .

  # 4. Update Profile
  echo -e "\n[4] Testing Update Profile..."
  curl -s -X PUT "$API_URL/api/doctors/profile" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "+910000000000",
      "specialization": "Senior Gynecologist"
    }' | jq .

  # 5. Get Patients
  echo -e "\n[5] Testing Get Patients..."
  curl -s -X GET "$API_URL/api/doctors/patients" \
    -H "Authorization: Bearer $TOKEN" | jq .
else
  echo -e "\n[!] Login failed, skipping protected routes"
fi

echo -e "\n-----------------------------------"
echo "Testing Completed"
echo "-----------------------------------"
