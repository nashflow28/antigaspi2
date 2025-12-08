#!/bin/bash
# 🧪 Test de mise à jour du profil merchant après fix database

echo "=== TEST MERCHANT PROFILE UPDATE - PRODUCTION ==="
echo ""

# 1. Login to get token
echo "1️⃣ Login as merchant..."
TOKEN=$(curl -s -X POST https://antigaspi.jubtek.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marie.martin@email.com",
    "password": "password"
  }' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

# 2. Test merchant profile update with description and siret
echo "2️⃣ Testing merchant profile update with description and siret..."
echo ""

RESPONSE=$(curl -s -X PUT https://antigaspi.jubtek.com/api/merchants/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Boulangerie Martin (Updated)",
    "description": "Boulangerie artisanale depuis 1995. Pain frais tous les jours !",
    "siret": "12345678901234",
    "business_type": "Boulangerie"
  }')

echo "$RESPONSE" | jq '.'
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ ✅ ✅ MERCHANT UPDATE SUCCESSFUL! BUG #1 FIXED! ✅ ✅ ✅"
  echo ""

  # 3. Verify data was saved
  echo "3️⃣ Verifying profile data..."
  curl -s -X GET https://antigaspi.jubtek.com/api/auth/me \
    -H "Authorization: Bearer $TOKEN" | jq '.data.merchant'
else
  echo "❌ Update failed - check error above"
fi
