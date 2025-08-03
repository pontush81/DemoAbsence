#!/bin/bash

# 🔍 SYSTEMATISK TEST AV ALLA AVVIKELSETYPER
# Testar vilka som får 'pending' vs 'approved' status

echo "🚀 SYSTEMATIC APPROVAL WORKFLOW TEST"
echo "===================================="

# Test data
EMPLOYEE_ID="1"
DATE=$(date +%Y-%m-%d)
BASE_URL="http://localhost:3000/api"

echo ""
echo "📋 TESTING ALL DEVIATION TYPES:"
echo ""

# Test 1: Sjukdom (Code 300) - Currently: requiresApproval=false
echo "1️⃣ TESTING: Sjukdom (Code 300)"
echo "   Expected: AUTO-APPROVED (based on current config)"
echo "   Perplexity says: SHOULD BE PENDING"
curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"300\",
    \"startTime\": \"08:00\",
    \"endTime\": \"16:00\",
    \"description\": \"Sjuk idag\",
    \"duration\": 8
  }" | jq '.status' || echo "ERROR"
echo ""

# Test 2: VAB (Code 400) - Currently: requiresApproval=false  
echo "2️⃣ TESTING: VAB (Code 400)"
echo "   Expected: AUTO-APPROVED (based on current config)"
echo "   Perplexity says: SHOULD BE PENDING"
curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"400\",
    \"startTime\": \"08:00\",
    \"endTime\": \"16:00\",
    \"description\": \"VAB - barn sjukt\",
    \"duration\": 8
  }" | jq '.status' || echo "ERROR"
echo ""

# Test 3: Övertid (Code 200) - Currently: requiresApproval=true
echo "3️⃣ TESTING: Övertid (Code 200)"
echo "   Expected: PENDING APPROVAL"
echo "   Perplexity says: SHOULD BE PENDING ✓"
curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"200\",
    \"startTime\": \"17:00\",
    \"endTime\": \"19:00\",
    \"description\": \"Övertid - deadline\",
    \"duration\": 2
  }" | jq '.status' || echo "ERROR"
echo ""

# Test 4: Semester (Code 100) - Currently: requiresApproval=true
echo "4️⃣ TESTING: Semester (Code 100)"
echo "   Expected: PENDING APPROVAL"
echo "   Perplexity says: SHOULD BE PENDING ✓"
curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"100\",
    \"startTime\": \"08:00\",
    \"endTime\": \"16:00\",
    \"description\": \"Planerad semester\",
    \"duration\": 8
  }" | jq '.status' || echo "ERROR"
echo ""

# Test 5: Sen ankomst (Code 500) - Currently: requiresApproval=true
echo "5️⃣ TESTING: Sen ankomst (Code 500)"
echo "   Expected: PENDING APPROVAL"
echo "   Perplexity says: SHOULD BE PENDING ✓"
curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"500\",
    \"startTime\": \"09:00\",
    \"endTime\": \"16:00\",
    \"description\": \"Sen pga tåg\",
    \"duration\": 7
  }" | jq '.status' || echo "ERROR"
echo ""

# Test 6: Kompledighet (Code 120) - Currently: requiresApproval=true
echo "6️⃣ TESTING: Kompledighet (Code 120)"
echo "   Expected: PENDING APPROVAL"
echo "   Perplexity says: SHOULD BE PENDING ✓"
curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"date\": \"$DATE\",
    \"timeCode\": \"120\",
    \"startTime\": \"08:00\",
    \"endTime\": \"16:00\",
    \"description\": \"Kompledighet för övertid\",
    \"duration\": 8
  }" | jq '.status' || echo "ERROR"
echo ""

echo "🎯 SUMMARY OF PERPLEXITY'S RECOMMENDATIONS:"
echo "============================================="
echo "ALL types should be PENDING according to Swedish law:"
echo "• Sjukdom (300): notification + approval required"
echo "• VAB (400): notification + approval required" 
echo "• Övertid (200): explicit approval required"
echo "• Semester (100): timing approval per Semesterlagen"
echo "• All others: discretionary approval required"
echo ""
echo "❓ QUESTION: Should we change sjukdom/VAB to requiresApproval=true?"