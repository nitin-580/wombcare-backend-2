#!/bin/bash

# Configuration
API_URL=${API_URL:-"http://localhost:8080"}
ADMIN_KEY="nitinisacoderandstudent"
ID_SUFFIX=$(date +%s)
TEST_USER_EMAIL="nutrition_test_$ID_SUFFIX@wombcare.com"

echo "-----------------------------------"
# Use direct font rendering styling for headings in logs
echo -e "\033[1;35mNutrition & Diet Management API Testing\033[0m"
echo "-----------------------------------"

# 1. Search Foods
echo -e "\n\033[1;36m[1] Searching for foods containing 'Apple'...\033[0m"
curl -s -X GET "$API_URL/api/diet-plans/foods?query=Apple" | jq .

# 2. Create a User Profile first to associate the diet plan
echo -e "\n\033[1;36m[2] Creating a test user profile...\033[0m"
USER_RESPONSE=$(curl -s -X POST "$API_URL/api/profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nitin Test User",
    "email": "'$TEST_USER_EMAIL'",
    "age": 28,
    "activePlan": "PCOS Reversal Plan",
    "planStatus": "Active"
  }')
echo "$USER_RESPONSE" | jq .

USER_ID=$(echo "$USER_RESPONSE" | jq -r '.data.id')

if [ "$USER_ID" = "null" ] || [ -z "$USER_ID" ]; then
  echo "❌ Failed to create user profile. Exiting."
  exit 1
fi

echo "Created User ID: $USER_ID"

# 3. Create a Diet Plan (Admin Endpoint)
echo -e "\n\033[1;36m[3] Admin: Creating a diet plan for User...\033[0m"
CREATE_PLAN_RESPONSE=$(curl -s -X POST "$API_URL/api/admin/diet-plans" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "name": "Personalized PCOS Anti-Inflammatory Diet",
    "description": "Customized diet designed for PCOS management focusing on low glycemic index foods.",
    "patientAge": "28",
    "patientHeight": "165 cm",
    "patientWeight": "68 kg",
    "patientGoal": "Weight Loss & Cycle Regularity",
    "patientDiet": "Vegetarian",
    "foodsToAvoid": ["Refined Sugars", "White Bread", "Processed Snacks"],
    "dailyTargets": [
      {"name": "Water Intake", "target": "3 Liters"},
      {"name": "Daily Calories", "target": "1600 kcal"}
    ],
    "dietData": [
      {
        "day": 1,
        "meals": [
          {
            "name": "Breakfast",
            "time": "08:30 AM",
            "foodItems": [
              {"name": "Oatmeal with Almond Milk", "quantity": "1 bowl", "calories": 250, "protein": 8, "carbs": 45, "fats": 5}
            ],
            "instructions": "Add a pinch of cinnamon."
          },
          {
            "name": "Lunch",
            "time": "01:30 PM",
            "foodItems": [
              {"name": "Quinoa Salad with Chickpeas", "quantity": "1 plate", "calories": 380, "protein": 12, "carbs": 55, "fats": 10}
            ]
          },
          {
            "name": "Snack",
            "time": "04:30 PM",
            "foodItems": [
              {"name": "Apple with Peanut Butter", "quantity": "1 apple + 1 tsp PB", "calories": 220, "protein": 4, "carbs": 25, "fats": 12}
            ]
          },
          {
            "name": "Dinner",
            "time": "08:00 PM",
            "foodItems": [
              {"name": "Tofu Stir Fry with Jasmine Rice", "quantity": "1 plate", "calories": 400, "protein": 15, "carbs": 50, "fats": 14}
            ]
          }
        ]
      }
    ]
  }')
echo "$CREATE_PLAN_RESPONSE" | jq .

PLAN_ID=$(echo "$CREATE_PLAN_RESPONSE" | jq -r '.data.id')

if [ "$PLAN_ID" = "null" ] || [ -z "$PLAN_ID" ]; then
  echo "❌ Failed to create diet plan. Exiting."
  exit 1
fi

echo "Created Diet Plan ID: $PLAN_ID"

# 4. Get Active Diet Plan for User (Public Endpoint)
echo -e "\n\033[1;36m[4] User: Fetching active diet plan...\033[0m"
curl -s -X GET "$API_URL/api/diet-plans/user/$USER_ID" | jq .

# 5. Track Meal (completed)
TODAY=$(date +"%Y-%m-%d")
echo -e "\n\033[1;36m[5] User: Tracking Meal (completed) on $TODAY...\033[0m"
curl -s -X POST "$API_URL/api/diet-plans/user/$USER_ID/track" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "'$TODAY'",
    "day": 1,
    "mealIndex": 0,
    "mealName": "Breakfast",
    "status": "completed",
    "completionTime": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }' | jq .

# 6. Track Meal (skipped)
echo -e "\n\033[1;36m[6] User: Tracking Meal (skipped) on $TODAY...\033[0m"
curl -s -X POST "$API_URL/api/diet-plans/user/$USER_ID/track" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "'$TODAY'",
    "day": 1,
    "mealIndex": 1,
    "mealName": "Lunch",
    "status": "skipped",
    "completionTime": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }' | jq .

# 7. Get Weekly Report
echo -e "\n\033[1;36m[7] User: Fetching Weekly Report...\033[0m"
curl -s -X GET "$API_URL/api/diet-plans/user/$USER_ID/reports" | jq .

# 8. Get Meal History
echo -e "\n\033[1;36m[8] User: Fetching Meal History logs...\033[0m"
curl -s -X GET "$API_URL/api/diet-plans/user/$USER_ID/history?startDate=$TODAY&endDate=$TODAY" | jq .

# 9. List All Plans (Admin Endpoint)
echo -e "\n\033[1;36m[9] Admin: Listing all diet plans...\033[0m"
curl -s -X GET "$API_URL/api/admin/diet-plans" \
  -H "x-admin-api-key: $ADMIN_KEY" | jq .

# 10. Update Diet Plan (Admin Endpoint)
echo -e "\n\033[1;36m[10] Admin: Updating Diet Plan (adding foods to avoid)...\033[0m"
curl -s -X PATCH "$API_URL/api/admin/diet-plans/$PLAN_ID" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "foodsToAvoid": ["Refined Sugars", "White Bread", "Processed Snacks", "Dairy Products"]
  }' | jq .

# 11. Delete Diet Plan (Admin Endpoint)
echo -e "\n\033[1;36m[11] Admin: Deleting Diet Plan...\033[0m"
curl -s -X DELETE "$API_URL/api/admin/diet-plans/$PLAN_ID" \
  -H "x-admin-api-key: $ADMIN_KEY" | jq .

echo -e "\n\033[1;32mTest execution completed!\033[0m"
