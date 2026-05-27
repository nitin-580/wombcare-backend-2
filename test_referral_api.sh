#!/bin/bash

# Configuration
API_URL="https://womb-care-backend-76858014616.europe-west1.run.app"
ADMIN_KEY="nitinisacoderandstudent"
RANDOM_SUFFIX=$(date +%s)
DOCTOR_EMAIL="dr.referral_$RANDOM_SUFFIX@wombcare.com"
DOCTOR_PASSWORD="DoctorPassword123!"
REFERRAL_EMAIL="patient_$RANDOM_SUFFIX@gmail.com"

echo "============================================="
echo "   WombCare Referral System Integration Test"
echo "============================================="

# 1. Signup Doctor
echo -e "\n[1] Registering a Test Doctor..."
SIGNUP_RES=$(curl -s -X POST "$API_URL/api/doctors/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Jenkins",
    "email": "'"$DOCTOR_EMAIL"'",
    "password": "'"$DOCTOR_PASSWORD"'",
    "phone": "+918888777766",
    "specialization": "Gynecology & Obstetrics",
    "credentials": "MD, DGO"
  }')
echo "Response: $SIGNUP_RES"
echo "---------------------------------------------"

# 1b. Promote Doctor to 'doctor' role
echo -e "\n[1b] Admin promoting registered user to 'doctor' role..."
PROMOTE_RES=$(curl -s -X POST "$API_URL/api/admin/users/role" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$DOCTOR_EMAIL"'",
    "role": "doctor"
  }')
echo "Response: $PROMOTE_RES"
echo "---------------------------------------------"

# 2. Login Doctor to retrieve JWT
echo -e "\n[2] Logging in the Test Doctor..."
LOGIN_RES=$(curl -s -X POST "$API_URL/api/doctors/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$DOCTOR_EMAIL"'",
    "password": "'"$DOCTOR_PASSWORD"'"
  }')
echo "Response: $LOGIN_RES"
TOKEN=$(echo $LOGIN_RES | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "\n[!] Doctor auth token generation failed. Aborting."
  exit 1
fi
echo "Doctor JWT: $TOKEN"
echo "---------------------------------------------"

# 3. Create a Referral
echo -e "\n[3] Submitting a new Referral..."
REFERRAL_RES=$(curl -s -X POST "$API_URL/api/referrals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "Aparna Sharma",
    "mobile": "+919000100022",
    "email": "'"$REFERRAL_EMAIL"'",
    "problem": "Frequent severe cycle fluctuations and heavy painful periods"
  }')
echo "Response: $REFERRAL_RES"
REFERRAL_ID=$(echo $REFERRAL_RES | jq -r '.referral.id // empty')

if [ -z "$REFERRAL_ID" ] || [ "$REFERRAL_ID" == "null" ]; then
  echo -e "\n[!] Referral creation failed. Aborting."
  exit 1
fi
echo "Created Referral ID: $REFERRAL_ID"
echo "---------------------------------------------"

# 4. Doctor lists referrals
echo -e "\n[4] Querying Doctor's own referral list..."
MY_REFERRALS_RES=$(curl -s -X GET "$API_URL/api/referrals/my-referrals" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $MY_REFERRALS_RES"
echo "---------------------------------------------"

# 5. Doctor views specific referral details
echo -e "\n[5] Fetching referral details by ID..."
REFERRAL_DETAIL_RES=$(curl -s -X GET "$API_URL/api/referrals/$REFERRAL_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $REFERRAL_DETAIL_RES"
echo "---------------------------------------------"

# 6. Admin lists all referrals
echo -e "\n[6] Admin globally listing all referrals..."
ADMIN_LIST_RES=$(curl -s -X GET "$API_URL/api/admin/referrals" \
  -H "x-admin-api-key: $ADMIN_KEY")
echo "Response: $ADMIN_LIST_RES"
echo "---------------------------------------------"

# 7. Admin updates referral status to contacted
echo -e "\n[7] Admin updating referral status to contacted..."
STATUS_RES=$(curl -s -X PATCH "$API_URL/api/admin/referrals/$REFERRAL_ID/status" \
  -H "x-admin-api-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "contacted"
  }')
echo "Response: $STATUS_RES"
echo "---------------------------------------------"

# 8. Admin converts referral to patient (account generated, email dispatched)
echo -e "\n[8] Admin converting referral into active WombCare account..."
CONVERSION_RES=$(curl -s -X POST "$API_URL/api/admin/referrals/convert/$REFERRAL_ID" \
  -H "x-admin-api-key: $ADMIN_KEY")
echo "Response: $CONVERSION_RES"
echo "---------------------------------------------"

# 9. Doctor securely requests patient clinical history
echo -e "\n[9] Doctor fetching converted patient profile and history..."
HISTORY_RES=$(curl -s -X GET "$API_URL/api/doctor/patient-history/$REFERRAL_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $HISTORY_RES"
echo "============================================="
echo "             Testing Complete!"
echo "============================================="
