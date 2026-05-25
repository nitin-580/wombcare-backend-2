#!/bin/bash

# Configuration
API_URL="http://localhost:3001"
ADMIN_KEY="nitinisacoderandstudent"

echo "--- Testing Public Blog API ---"
echo "1. List Blogs (Public)"
curl -X GET "$API_URL/api/blogs"
echo -e "\n"

echo "--- Testing Admin Blog API ---"
echo "2. Create Blog (Admin)"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/admin/blogs" \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -d '{
    "title": "Test Blog Header",
    "content": "This is a test blog content to verify our API is working.",
    "authorName": "Admin User"
  }')
echo $CREATE_RESPONSE
echo -e "\n"

# Extract ID if possible for further tests (Update/Delete)
BLOG_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | head -n 1 | cut -d':' -f2 | tr -d '"')

if [ ! -z "$BLOG_ID" ]; then
  echo "Created Blog ID: $BLOG_ID"

  echo "3. Get Blog by ID (Public)"
  curl -X GET "$API_URL/api/blogs/$BLOG_ID"
  echo -e "\n"

  echo "4. Update Blog (Admin)"
  curl -X PATCH "$API_URL/api/admin/blogs/$BLOG_ID" \
    -H "Content-Type: application/json" \
    -H "x-admin-api-key: $ADMIN_KEY" \
    -d '{"title": "Updated Test Blog Title"}'
  echo -e "\n"

  echo "5. Delete Blog (Admin)"
  curl -X DELETE "$API_URL/api/admin/blogs/$BLOG_ID" \
    -H "x-admin-api-key: $ADMIN_KEY"
  echo -e "\n"
else
  echo "Failed to extract Blog ID. Skipping update and delete tests."
fi
