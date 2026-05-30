#!/bin/bash

# Configuration
API_URL=${API_URL:-"http://localhost:3001"}
ADMIN_KEY="nitinisacoderandstudent"

echo "-----------------------------------"
echo "Womb Care Banners API Testing"
echo "-----------------------------------"

# 1. Fetch active banners (Public route)
echo -e "\n[1] Testing Fetch Active Banners (Public)..."
curl -s -X GET "$API_URL/api/banners" | jq .

# 2. Create Banner as Admin (Unauthorized check)
echo -e "\n[2] Testing Create Banner as Admin (Unauthorized - No API Key)..."
curl -s -X POST "$API_URL/api/admin/banners" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Unauthorized Banner Test",
    "imageUrl": "https://example.com/image.jpg",
    "targetUrl": "https://example.com",
    "position": 1
  }' | jq .

# 3. Create Banner as Admin (Authorized)
echo -e "\n[3] Testing Create Banner as Admin (Authorized)..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/admin/banners" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "✨ 14-Day Fertility Yoga Challenge\nDaily guided yoga & hormone sync guidelines.",
    "imageUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop",
    "targetUrl": "https://wombcare.in/challenges/fertility-yoga",
    "position": 3,
    "isActive": true
  }')
echo "$CREATE_RESPONSE" | jq .

BANNER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo "Created Banner ID: $BANNER_ID"

if [ "$BANNER_ID" != "null" ] && [ -n "$BANNER_ID" ]; then

  # 4. Fetch All Banners as Admin (Paginated)
  echo -e "\n[4] Testing Fetch All Banners as Admin (Paginated)..."
  curl -s -X GET "$API_URL/api/admin/banners?page=1&limit=5" \
    -H "x-admin-api-key: $ADMIN_KEY" | jq .

  # 5. Fetch Active Banners as Public (Check if new banner is listed)
  echo -e "\n[5] Testing Fetch Active Banners as Public again..."
  curl -s -X GET "$API_URL/api/banners" | jq .

  # 6. Update Banner as Admin
  echo -e "\n[6] Testing Update Banner as Admin..."
  curl -s -X PATCH "$API_URL/api/admin/banners/$BANNER_ID" \
    -H "x-admin-api-key: $ADMIN_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "✨ 14-Day Fertility Yoga Challenge (Updated Title) 🌸",
      "position": 1
    }' | jq .

  # 7. Delete Banner as Admin
  echo -e "\n[7] Testing Delete Banner as Admin..."
  curl -s -X DELETE "$API_URL/api/admin/banners/$BANNER_ID" \
    -H "x-admin-api-key: $ADMIN_KEY" | jq .

  # 8. Fetch Active Banners as Public (Confirm deletion)
  echo -e "\n[8] Testing Fetch Active Banners as Public (Post-Delete verification)..."
  curl -s -X GET "$API_URL/api/banners" | jq .

else
  echo "Banner creation failed, skipping dependency tests."
fi

echo -e "\n-----------------------------------"
echo "Testing Completed"
echo "-----------------------------------"
