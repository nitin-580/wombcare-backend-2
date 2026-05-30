#!/bin/bash

# Configuration
API_URL=${API_URL:-"http://localhost:3001"}
ADMIN_KEY="nitinisacoderandstudent"

# Create a temporary doctor account to get a valid token
DOCTOR_EMAIL="dr.referral_$(date +%s)@example.com"
DOCTOR_PASSWORD="Password123!"

echo "-----------------------------------"
echo "Phase 2: Banner Upload & Referral Flow Testing"
echo "-----------------------------------"

# 1. Setup: Register & Login Doctor
echo -e "\n[1] Setup: Registering Doctor account..."
curl -s -X POST "$API_URL/api/doctors/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Referral Tester",
    "email": "'"$DOCTOR_EMAIL"'",
    "password": "'"$DOCTOR_PASSWORD"'",
    "phone": "+918888877777",
    "specialization": "Gynecology",
    "credentials": "MBBS"
  }' > /dev/null

echo "Setup: Logging in Doctor account..."
LOGIN_RESP=$(curl -s -X POST "$API_URL/api/doctors/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$DOCTOR_EMAIL"'",
    "password": "'"$DOCTOR_PASSWORD"'"
  }')
DOCTOR_TOKEN=$(echo $LOGIN_RESP | jq -r '.token // empty')

if [ -z "$DOCTOR_TOKEN" ] || [ "$DOCTOR_TOKEN" == "null" ]; then
  echo "[-] Setup failed: Could not log in doctor."
  exit 1
fi
echo "[+] Setup complete! Doctor Token retrieved."

# 2. Testing Simplified Referral Creation (No Email, clinical condition PCOD/PMOS)
echo -e "\n[2] Testing Simplified Referral (Doctor submits Name, Mobile, and PCOD/PMOS)..."
REFERRAL_RESP=$(curl -s -X POST "$API_URL/api/referrals" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "Amrita Rao",
    "mobile": "+919999911111",
    "problem": "PCOD/PMOS"
  }')
echo "$REFERRAL_RESP" | jq .

REFERRAL_ID=$(echo "$REFERRAL_RESP" | jq -r '.referral.id // empty')
REF_EMAIL=$(echo "$REFERRAL_RESP" | jq -r '.referral.email // empty')

if [ -z "$REFERRAL_ID" ] || [ "$REFERRAL_ID" == "null" ]; then
  echo "[-] Referral submission failed."
  exit 1
fi

echo "[+] Referral created successfully! ID: $REFERRAL_ID"
echo "[+] Referral Email in database: '$REF_EMAIL'"

# 3. Testing Admin Conversion with Custom Email Address
echo -e "\n[3] Testing Admin Conversion (Convert referral to active patient using a customized email)..."
CUSTOM_EMAIL="amrita.rao_$(date +%s)@example.com"
CONVERT_RESP=$(curl -s -X POST "$API_URL/api/admin/referrals/convert/$REFERRAL_ID" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$CUSTOM_EMAIL"'"
  }')
echo "$CONVERT_RESP" | jq .

CONVERTED_EMAIL=$(echo "$CONVERT_RESP" | jq -r '.referral.email // empty')
CONVERT_STATUS=$(echo "$CONVERT_RESP" | jq -r '.referral.referralStatus // empty')

if [ "$CONVERT_STATUS" == "converted" ]; then
  echo "[+] Success! Referral converted to active patient account."
  echo "[+] Converted Patient email updated to: '$CONVERTED_EMAIL'"
else
  echo "[-] Conversion failed."
  exit 1
fi

# 4. Testing administrative banner image upload endpoint
echo -e "\n[4] Testing Banner Multipart Upload (POST /api/admin/banners/upload)..."
# Create a dummy image file for multipart testing
echo "DUMMY IMAGE BYTES" > dummy_test_banner.jpg

UPLOAD_RESP=$(curl -s -X POST "$API_URL/api/admin/banners/upload" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -F "image=@dummy_test_banner.jpg")
echo "$UPLOAD_RESP" | jq .

UPLOADED_URL=$(echo "$UPLOAD_RESP" | jq -r '.data.url // empty')
rm dummy_test_banner.jpg

if [ -n "$UPLOADED_URL" ] && [ "$UPLOADED_URL" != "null" ]; then
  echo "[+] Success! Banner uploaded to Supabase Storage bucket."
  echo "[+] Public URL: '$UPLOADED_URL'"
else
  echo "[-] Banner upload failed."
  exit 1
fi

echo -e "\n-----------------------------------"
echo "Phase 2 Testing Completed"
echo "-----------------------------------"
