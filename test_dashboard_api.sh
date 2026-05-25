#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
DOCTOR_EMAIL="dr.dashboard_$(date +%s)@example.com"
DOCTOR_PASSWORD="Password123!"

echo "-----------------------------------"
echo "Doctor Dashboard API Testing"
echo "-----------------------------------"

# 1. Signup Doctor
echo -e "\n[1] Testing Doctor Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/api/doctors/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Dashboard Test",
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
  # 3. Get Appointments
  echo -e "\n[3] Testing Get Appointments..."
  curl -s -X GET "$API_URL/api/doctors/appointments" \
    -H "Authorization: Bearer $TOKEN" | jq .

  # 4. Get Earnings
  echo -e "\n[4] Testing Get Earnings..."
  curl -s -X GET "$API_URL/api/doctors/earnings" \
    -H "Authorization: Bearer $TOKEN" | jq .

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
