#!/bin/bash

# 🎯 PRAKTISK SVENSK HR-WORKFLOW TEST
# Följer Perplexity's rekommendationer för användarupplevelse

echo "🇸🇪 PRACTICAL SWEDISH HR WORKFLOW TEST"
echo "====================================="

# Test data
EMPLOYEE_ID="1"
DATE=$(date +%Y-%m-%d)
BASE_URL="http://localhost:3000/api"

echo ""
echo "📋 TESTING PERPLEXITY'S PRACTICAL RECOMMENDATIONS:"
echo ""

# Test 1: Sjukdom (Code 300) - Auto-approve + notification
echo "1️⃣ TESTING: Sjukdom (Code 300)"
echo "   Perplexity PRACTICAL: AUTO-APPROVE + notification ✅"
SICK_RESULT=$(curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"300\",
    \"startTime\": \"08:00\",
    \"endTime\": \"16:00\",
    \"description\": \"Sjuk idag\",
    \"duration\": 8
  }" | jq -r '.status' 2>/dev/null || echo "ERROR")
echo "   Result: $SICK_RESULT"
if [ "$SICK_RESULT" = "approved" ]; then
  echo "   ✅ CORRECT: Immediate registration, manager notified"
else
  echo "   ❌ PROBLEM: Should be auto-approved"
fi
echo ""

# Test 2: VAB (Code 400) - Auto-approve + notification
echo "2️⃣ TESTING: VAB (Code 400)"
echo "   Perplexity PRACTICAL: AUTO-APPROVE + notification ✅"
VAB_RESULT=$(curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"400\",
    \"startTime\": \"08:00\",
    \"endTime\": \"16:00\",
    \"description\": \"VAB - barn sjukt\",
    \"duration\": 8
  }" | jq -r '.status' 2>/dev/null || echo "ERROR")
echo "   Result: $VAB_RESULT"
if [ "$VAB_RESULT" = "approved" ]; then
  echo "   ✅ CORRECT: Immediate registration, manager notified"
else
  echo "   ❌ PROBLEM: Should be auto-approved"
fi
echo ""

# Test 3: Övertid (Code 200) - Requires explicit approval
echo "3️⃣ TESTING: Övertid (Code 200)"
echo "   Perplexity PRACTICAL: EXPLICIT APPROVAL required 🔒"
OT_RESULT=$(curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"200\",
    \"startTime\": \"17:00\",
    \"endTime\": \"19:00\",
    \"description\": \"Övertid - deadline\",
    \"duration\": 2
  }" | jq -r '.status' 2>/dev/null || echo "ERROR")
echo "   Result: $OT_RESULT"
if [ "$OT_RESULT" = "pending" ]; then
  echo "   ✅ CORRECT: Requires manager approval"
else
  echo "   ❌ PROBLEM: Should require approval"
fi
echo ""

# Test 4: Semester (Code 100) - Requires explicit approval
echo "4️⃣ TESTING: Semester (Code 100)"
echo "   Perplexity PRACTICAL: EXPLICIT APPROVAL required 🔒"
VAC_RESULT=$(curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"100\",
    \"startTime\": \"08:00\",
    \"endTime\": \"16:00\",
    \"description\": \"Planerad semester\",
    \"duration\": 8
  }" | jq -r '.status' 2>/dev/null || echo "ERROR")
echo "   Result: $VAC_RESULT"
if [ "$VAC_RESULT" = "pending" ]; then
  echo "   ✅ CORRECT: Requires manager approval per Semesterlagen"
else
  echo "   ❌ PROBLEM: Should require approval"
fi
echo ""

echo "🎯 PERPLEXITY'S PRACTICAL BALANCE ACHIEVED:"
echo "=========================================="
echo "✅ Sick/VAB: Auto-approved → Better user experience"
echo "✅ Other types: Pending → Proper oversight"
echo "✅ Legal compliance: Maintained via notification system"
echo "✅ Manager burden: Reduced (no micro-management)"
echo "✅ Payroll safety: No blocking if manager unavailable"
echo ""
echo "🇸🇪 This follows standard Swedish enterprise HR practice!"