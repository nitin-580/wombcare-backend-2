#!/bin/bash

# Configuration
API_URL="http://localhost:3001"
ADMIN_KEY="nitinisacoderandstudent"

echo "-----------------------------------"
echo "Womb Care API Testing Suite"
echo "-----------------------------------"

# 1. Health Check
echo -e "\n[1] Testing Health Check..."
curl -s "$API_URL/api/health" | jq .

# 2. Public Blogs
echo -e "\n[2] Testing Public Blogs List..."
curl -s "$API_URL/api/blogs" | jq .

# 3. Public Careers
echo -e "\n[3] Testing Public Careers List..."
curl -s "$API_URL/api/careers" | jq .

# 4. Early Access Registration
echo -e "\n[4] Testing Early Access Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/early-access" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test_'"$(date +%s)"'@example.com",
    "phone": "+919988776655",
    "age": 25,
    "weight": 60,
    "cycleRegularity": "Regular",
    "symptoms": "None",
    "country": "IN",
    "source": "Test Script"
  }')
echo $REGISTER_RESPONSE | jq .

# 5. Admin Stats (Authorized)
echo -e "\n[5] Testing Admin Stats (Authorized)..."
curl -s -X GET "$API_URL/api/admin/stats" \
  -H "x-admin-api-key: $ADMIN_KEY" | jq .

# 6. Admin Stats (Unauthorized)
echo -e "\n[6] Testing Admin Stats (Unauthorized)..."
curl -s -X GET "$API_URL/api/admin/stats" | jq .

# 7. Admin Users List
echo -e "\n[7] Testing Admin Users List..."
curl -s -X GET "$API_URL/api/admin/users" \
  -H "x-admin-api-key: $ADMIN_KEY" | jq .

# 8. Admin Blog CRUD
echo -e "\n[8] Testing Admin Blog Creation..."
CREATE_BLOG_RESPONSE=$(curl -s -X POST "$API_URL/api/admin/blogs" \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -d '{
    "title": "Automated Test Blog",
    "content": "This is a test blog content.",
    "authorName": "Test Runner"
  }')
echo $CREATE_BLOG_RESPONSE | jq .

BLOG_ID=$(echo $CREATE_BLOG_RESPONSE | jq -r '.data.id // empty')

if [ ! -z "$BLOG_ID" ] && [ "$BLOG_ID" != "null" ]; then
  echo -e "\n[8.1] Testing Get Blog by ID..."
  curl -s -X GET "$API_URL/api/blogs/$BLOG_ID" | jq .

  echo -e "\n[8.2] Testing Admin Blog Update..."
  curl -s -X PATCH "$API_URL/api/admin/blogs/$BLOG_ID" \
    -H "Content-Type: application/json" \
    -H "x-admin-api-key: $ADMIN_KEY" \
    -d '{"title": "Updated Automated Test Blog"}' | jq .

  echo -e "\n[8.3] Testing Admin Blog Deletion..."
  curl -s -X DELETE "$API_URL/api/admin/blogs/$BLOG_ID" \
    -H "x-admin-api-key: $ADMIN_KEY" | jq .
else
  echo -e "\n[!] Skipping Blog Detail/Update/Delete - ID not found"
fi

# 9. Admin Career CRUD
echo -e "\n[9] Testing Admin Career Creation..."
CREATE_CAREER_RESPONSE=$(curl -s -X POST "$API_URL/api/admin/careers" \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -d '{
    "title": "Software Engineer (Test)",
    "department": "Engineering",
    "location": "Remote",
    "type": "Full-time",
    "description": "Test job description",
    "requirements": ["Test req 1", "Test req 2"]
  }')
echo $CREATE_CAREER_RESPONSE | jq .

CAREER_ID=$(echo $CREATE_CAREER_RESPONSE | jq -r '.data.id // empty')

if [ ! -z "$CAREER_ID" ] && [ "$CAREER_ID" != "null" ]; then
  echo -e "\n[9.1] Testing Get Career by ID..."
  curl -s -X GET "$API_URL/api/careers/$CAREER_ID" | jq .

  echo -e "\n[9.2] Testing Admin Career Update..."
  curl -s -X PATCH "$API_URL/api/admin/careers/$CAREER_ID" \
    -H "Content-Type: application/json" \
    -H "x-admin-api-key: $ADMIN_KEY" \
    -d '{"title": "Senior Software Engineer (Test)"}' | jq .

  echo -e "\n[9.3] Testing Admin Career Deletion..."
  curl -s -X DELETE "$API_URL/api/admin/careers/$CAREER_ID" \
    -H "x-admin-api-key: $ADMIN_KEY" | jq .
else
  echo -e "\n[!] Skipping Career Detail/Update/Delete - ID not found"
fi

echo -e "\n-----------------------------------"
echo "Testing Completed"
echo "-----------------------------------"
