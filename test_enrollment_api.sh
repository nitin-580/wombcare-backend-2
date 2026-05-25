#!/bin/bash

# Configuration
API_URL="http://localhost:3001"

echo "-----------------------------------"
echo "Womb Care Enrollment API Testing"
echo "-----------------------------------"

# 1. Enrollment Submission
echo -e "\n[1] Testing Enrollment Submission..."
ENROLL_RESPONSE=$(curl -s -X POST "$API_URL/api/enrollments" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "age": "30",
    "phone": "+919988776655",
    "city": "Mumbai",
    "symptoms": "Occasional cramping",
    "duration": "2 months",
    "plan": "premium",
    "consultationTime": "Evening",
    "notes": "Looking for holistic approach"
  }')
echo $ENROLL_RESPONSE | jq .

# 2. Get All Enrollments
echo -e "\n[2] Testing Get All Enrollments..."
curl -s -X GET "$API_URL/api/enrollments" | jq .

echo -e "\n-----------------------------------"
echo "Testing Completed"
echo "-----------------------------------"
