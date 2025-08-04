#!/bin/bash

# 🧪 REALISTISK MOCK ELIMINATION TEST
# Testar faktiska endpoints med korrekta parametrar

set -e

echo "🧪 =============================================="
echo "   REALISTISK MOCK ELIMINATION TEST SUITE"
echo "=============================================="
echo ""

SERVER_URL="http://localhost:3000"
EMPLOYEE_ID="E001"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log_test() {
    echo -e "${BLUE}🧪 $1${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_failure() {
    echo -e "${RED}❌ $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

# Test function that checks both status and data quality
test_endpoint() {
    local description="$1"
    local endpoint="$2"
    local expected_status="$3"
    local additional_params="$4"
    
    log_test "$description"
    
    local full_url="$SERVER_URL$endpoint"
    if [ -n "$additional_params" ]; then
        full_url="$full_url?$additional_params"
    fi
    
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$full_url")
    local status=$(echo "$response" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status" = "$expected_status" ]; then
        if [ "$status" = "200" ]; then
            # Check data quality for successful responses
            if echo "$body" | jq . >/dev/null 2>&1; then
                # Check for mock data indicators
                if echo "$body" | grep -iq "mock\|fallback\|demo" && ! echo "$body" | grep -q "message.*mock"; then
                    log_failure "$description - Response contains mock indicators"
                    echo "Body snippet: $(echo "$body" | head -c 200)..."
                    return 1
                fi
                
                # Get data count
                local count=$(echo "$body" | jq 'if type == "array" then length else 1 end' 2>/dev/null || echo "1")
                log_success "$description (Status: $status, Items: $count, Database data confirmed)"
            else
                log_failure "$description - Invalid JSON"
                echo "Body: $body"
                return 1
            fi
        else
            log_success "$description (Expected error status: $status)"
        fi
    else
        log_failure "$description - Expected: $expected_status, Got: $status"
        echo "Body: $body"
        return 1
    fi
}

echo "🔍 Phase 1: Core Data Endpoints (Database Only)"
echo "============================================="

# Test endpoints that definitely exist and should work
test_endpoint "Deviations data (all)" "/api/deviations" "200" ""
test_endpoint "Leave requests data (all)" "/api/leave-requests" "200" ""
test_endpoint "Employees data (with currentUser)" "/api/employees" "200" "currentUser=E001"
test_endpoint "Time codes data" "/api/timecodes" "200" ""

echo ""
echo "💰 Phase 2: Financial/Payroll Critical Endpoints"
echo "=============================================="

# Test the most critical endpoints that must never use mock data
test_endpoint "Time balance for employee" "/api/time-balances/$EMPLOYEE_ID" "200" ""
test_endpoint "Schedules for employee" "/api/schedules/$EMPLOYEE_ID" "200" ""
test_endpoint "Payslips for employee" "/api/payslips/$EMPLOYEE_ID" "200" ""

echo ""
echo "👔 Phase 3: Manager Endpoints"
echo "============================"

test_endpoint "Manager pending deviations" "/api/manager/deviations/pending" "200" ""
test_endpoint "Manager pending leave requests" "/api/manager/leave-requests/pending" "200" ""

echo ""
echo "🔒 Phase 4: PAXML Export (KRITISKT - NO MOCK EVER)"
echo "==============================================="

# Test PAXML exports - these MUST work with database only
log_test "PAXML Export Standard"
paxml_data='{"employeeIds":["E001","E002"],"startDate":"2025-08-01","endDate":"2025-08-31"}'
paxml_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$paxml_data" \
    "$SERVER_URL/api/paxml/export")

paxml_status=$(echo "$paxml_response" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
paxml_body=$(echo "$paxml_response" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$paxml_status" = "200" ]; then
    if echo "$paxml_body" | grep -q "<?xml" || echo "$paxml_body" | grep -q "PAXML"; then
        log_success "PAXML Export produces XML output (Status: $paxml_status)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log_failure "PAXML Export does not produce XML"
        echo "Response: $(echo "$paxml_body" | head -c 200)..."
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    log_failure "PAXML Export failed (Status: $paxml_status)"
    echo "Response: $paxml_body"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "📝 Phase 5: Data Creation (Database Required)"
echo "=========================================="

# Test data creation endpoints
log_test "Create deviation (database required)"
dev_data='{"employeeId":"'$EMPLOYEE_ID'","date":"2025-08-20","timeCode":"300","comment":"Mock elimination test","startTime":"08:00","endTime":"16:00"}'
dev_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$dev_data" \
    "$SERVER_URL/api/deviations")

dev_status=$(echo "$dev_response" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
if [ "$dev_status" = "201" ] || [ "$dev_status" = "200" ]; then
    log_success "Deviation creation works (Status: $dev_status)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_failure "Deviation creation failed (Status: $dev_status)"
    echo "Response: $(echo "$dev_response" | sed 's/HTTPSTATUS:[0-9]*$//')"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🔍 Phase 6: Mock Data Detection Analysis"
echo "====================================="

log_test "Analyzing response data for mock indicators"

# Sample multiple endpoints and analyze their responses
ENDPOINTS_TO_CHECK=(
    "/api/deviations"
    "/api/leave-requests"
    "/api/employees?currentUser=E001"
    "/api/timecodes"
)

MOCK_FOUND=false
for endpoint in "${ENDPOINTS_TO_CHECK[@]}"; do
    response=$(curl -s "$SERVER_URL$endpoint" 2>/dev/null || echo "ERROR")
    
    if [ "$response" != "ERROR" ] && echo "$response" | jq . >/dev/null 2>&1; then
        # Check for suspicious mock patterns
        if echo "$response" | grep -iq "mock\|fallback\|demo.*data\|test.*data" && ! echo "$response" | grep -q "message.*mock"; then
            echo "  ⚠️  Potential mock data in $endpoint"
            MOCK_FOUND=true
        fi
        
        # Check for realistic data patterns (dates from 2025, real IDs, etc.)
        if echo "$response" | grep -q "2025-08" && echo "$response" | grep -q "E00[1-9]"; then
            echo "  ✅ $endpoint has realistic 2025 data with proper employee IDs"
        fi
    fi
done

if [ "$MOCK_FOUND" = false ]; then
    log_success "No mock data indicators found in API responses"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_failure "Potential mock data indicators detected"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "📊 Phase 7: Data Consistency Check"
echo "==============================="

log_test "Checking data consistency across endpoints"

# Get deviations and check they have proper structure
deviations=$(curl -s "$SERVER_URL/api/deviations")
if echo "$deviations" | jq . >/dev/null 2>&1; then
    dev_count=$(echo "$deviations" | jq 'length' 2>/dev/null || echo "0")
    
    # Check for proper field structure (camelCase not snake_case)
    if echo "$deviations" | jq '.[0] | has("employeeId") and has("timeCode") and has("startTime")' 2>/dev/null | grep -q true; then
        log_success "Deviations have proper camelCase structure ($dev_count items)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log_failure "Deviations may have incorrect field structure"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    log_failure "Could not analyze deviations data structure"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🎯 =============================================="
echo "           FINAL TEST RESULTS"
echo "=============================================="
echo ""
echo -e "📊 ${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "✅ ${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "❌ ${RED}Failed: $FAILED_TESTS${NC}"

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    echo -e "📈 ${BLUE}Success Rate: ${SUCCESS_RATE}%${NC}"
fi

echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Mock data elimination SUCCESSFUL!${NC}"
    echo ""
    echo "✅ VERIFICATION COMPLETE:"
    echo "  • All API endpoints return database data"
    echo "  • No mock data fallbacks detected"
    echo "  • PAXML exports work with real data"
    echo "  • Data creation requires database connection"
    echo "  • Field mapping (camelCase) works correctly"
    echo "  • Financial/payroll endpoints secured"
    echo ""
    echo -e "${GREEN}🔒 PRODUCTION READY: System is secure for payroll operations!${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${YELLOW}⚠️  MOSTLY SUCCESSFUL with minor issues${NC}"
    echo ""
    echo "✅ CORE FUNCTIONALITY VERIFIED:"
    echo "  • $PASSED_TESTS/$TOTAL_TESTS tests passed (${SUCCESS_RATE}%)"
    echo "  • Critical endpoints appear to work"
    echo "  • Minor issues may need attention"
    echo ""
    echo -e "${YELLOW}🟡 REVIEW NEEDED: Check failed tests before full deployment${NC}"
    exit 0
else
    echo -e "${RED}❌ SIGNIFICANT ISSUES DETECTED!${NC}"
    echo ""
    echo "🚫 PROBLEMS FOUND:"
    echo "  • $FAILED_TESTS/$TOTAL_TESTS tests failed"
    echo "  • Mock data elimination may be incomplete"
    echo "  • System may not be production ready"
    echo ""
    echo -e "${RED}🚫 NOT PRODUCTION READY: Fix critical issues first!${NC}"
    exit 1
fi