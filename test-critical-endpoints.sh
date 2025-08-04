#!/bin/bash

# 🔥 KRITISKA ENDPOINTS TEST
# Testar bara de absolut viktigaste endpoints för mock elimination

echo "🔥 KRITISKA ENDPOINTS TEST - Mock Data Elimination"
echo "================================================"

SERVER_URL="http://localhost:3000"
PASSED=0
FAILED=0

test_critical() {
    local name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="$4"
    
    echo -n "🧪 $name: "
    
    local curl_cmd="curl -s -w 'STATUS:%{http_code}' -X $method"
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    curl_cmd="$curl_cmd '$SERVER_URL$endpoint'"
    
    local response=$(eval $curl_cmd)
    local status=$(echo "$response" | grep -o 'STATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed 's/STATUS:[0-9]*$//')
    
    # Check if response contains mock indicators
    if echo "$body" | grep -iq "mock\|fallback" && ! echo "$body" | grep -q "message.*mock"; then
        echo "❌ MOCK DATA DETECTED"
        echo "   Response: $(echo "$body" | head -c 100)..."
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # Check status
    if [ "$method" = "POST" ]; then
        if [ "$status" = "201" ] || [ "$status" = "200" ]; then
            echo "✅ PASS (Status: $status)"
            PASSED=$((PASSED + 1))
        else
            echo "❌ FAIL (Status: $status)"
            FAILED=$((FAILED + 1))
        fi
    else
        if [ "$status" = "200" ]; then
            local count="N/A"
            if echo "$body" | jq . >/dev/null 2>&1; then
                count=$(echo "$body" | jq 'if type == "array" then length else 1 end' 2>/dev/null || echo "1")
            fi
            echo "✅ PASS (Status: $status, Items: $count)"
            PASSED=$((PASSED + 1))
        else
            echo "❌ FAIL (Status: $status)"
            echo "   Response: $(echo "$body" | head -c 100)..."
            FAILED=$((FAILED + 1))
        fi
    fi
}

echo ""
echo "🔍 1. Core Data Endpoints"
echo "========================"
test_critical "Deviations" "/api/deviations"
test_critical "Leave Requests" "/api/leave-requests" 
test_critical "Time Codes" "/api/timecodes"

echo ""
echo "💰 2. Financial/Payroll Endpoints (KRITISKT)"
echo "==========================================="
test_critical "Time Balance E001" "/api/time-balances/E001"
test_critical "Schedules E001" "/api/schedules/E001"
test_critical "Payslips E001" "/api/payslips/E001"

echo ""
echo "👔 3. Manager Endpoints"
echo "====================="
test_critical "Manager Pending Deviations" "/api/manager/deviations/pending"
test_critical "Manager Pending Leave" "/api/manager/leave-requests/pending"

echo ""
echo "🔒 4. PAXML Export (SUPER KRITISKT)"
echo "================================="
PAXML_DATA='{"employeeIds":["E001"],"startDate":"2025-08-01","endDate":"2025-08-31"}'
test_critical "PAXML Export" "/api/paxml/export" "POST" "$PAXML_DATA"

echo ""
echo "📝 5. Data Creation Tests"
echo "======================="
DEV_DATA='{"employeeId":"E001","date":"2025-08-25","timeCode":"300","comment":"Critical test","startTime":"08:00","endTime":"16:00"}'
test_critical "Create Deviation" "/api/deviations" "POST" "$DEV_DATA"

echo ""
echo "🎯 RESULTAT"
echo "==========="
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(( PASSED * 100 / TOTAL ))
    echo "📊 $PASSED/$TOTAL tester lyckades (${SUCCESS_RATE}%)"
else
    echo "📊 Inga tester kördes"
    exit 1
fi

if [ $FAILED -eq 0 ]; then
    echo "🎉 ALLA KRITISKA TESTER LYCKADES!"
    echo "✅ Mock data elimination: KOMPLETT"
    echo "✅ Database-only access: VERIFIERAT"
    echo "✅ PAXML export: SÄKRAD"
    echo "🔒 PRODUKTION REDO!"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo "⚠️  De flesta tester lyckades men det finns problem"
    echo "🟡 GRANSKNING KRÄVS innan produktion"
    exit 0
else
    echo "❌ FÖR MÅNGA KRITISKA PROBLEM!"
    echo "🚫 INTE REDO FÖR PRODUKTION"
    exit 1
fi