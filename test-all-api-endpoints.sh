#!/bin/bash

# 🧪 COMPREHENSIVE API ENDPOINT TEST
# Tests all API endpoints against both localhost and production to identify routing issues

echo "🚀 COMPREHENSIVE API ENDPOINT TEST"
echo "=================================="
echo ""

LOCAL_URL="http://localhost:3000"
PROD_URL="https://demo-absence.vercel.app"
SAMPLE_EMPLOYEE_ID="E001"
SAMPLE_DEVIATION_ID="1"
SAMPLE_LEAVE_ID="1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local description=$3
    
    echo "🔍 TESTING: $description"
    echo "   Endpoint: $endpoint"
    echo "   Method: $method"
    
    # Test localhost
    if [ "$method" = "GET" ]; then
        LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LOCAL_URL$endpoint")
    else
        LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$LOCAL_URL$endpoint")
    fi
    
    # Test production
    if [ "$method" = "GET" ]; then
        PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$endpoint")
    else
        PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$PROD_URL$endpoint")
    fi
    
    # Status interpretation
    printf "   Localhost: "
    if [ "$LOCAL_STATUS" = "200" ]; then
        printf "${GREEN}✅ $LOCAL_STATUS${NC}"
    elif [ "$LOCAL_STATUS" = "404" ]; then
        printf "${RED}❌ $LOCAL_STATUS (NOT FOUND)${NC}"
    elif [ "$LOCAL_STATUS" = "500" ]; then
        printf "${YELLOW}⚠️  $LOCAL_STATUS (SERVER ERROR)${NC}"
    else
        printf "${BLUE}ℹ️  $LOCAL_STATUS${NC}"
    fi
    
    printf " | Production: "
    if [ "$PROD_STATUS" = "200" ]; then
        printf "${GREEN}✅ $PROD_STATUS${NC}\n"
    elif [ "$PROD_STATUS" = "404" ]; then
        printf "${RED}❌ $PROD_STATUS (NOT FOUND)${NC}\n"
    elif [ "$PROD_STATUS" = "500" ]; then
        printf "${YELLOW}⚠️  $PROD_STATUS (SERVER ERROR)${NC}\n"
    else
        printf "${BLUE}ℹ️  $PROD_STATUS${NC}\n"
    fi
    
    # Flag mismatches
    if [ "$LOCAL_STATUS" != "$PROD_STATUS" ]; then
        printf "   ${YELLOW}⚠️  MISMATCH: Local ($LOCAL_STATUS) ≠ Production ($PROD_STATUS)${NC}\n"
    fi
    
    echo ""
}

echo "📋 TESTING CORE ENDPOINTS:"
echo "=========================="
echo ""

# Basic endpoints
test_endpoint "/api/hello" "GET" "Hello endpoint (basic connectivity)"
test_endpoint "/api/employees" "GET" "All employees"
test_endpoint "/api/employees/$SAMPLE_EMPLOYEE_ID" "GET" "Single employee"
test_endpoint "/api/timecodes" "GET" "Time codes"
test_endpoint "/api/schedules" "GET" "All schedules"
test_endpoint "/api/schedules/$SAMPLE_EMPLOYEE_ID" "GET" "Employee schedule"

echo "📋 TESTING DEVIATION ENDPOINTS:"
echo "==============================="
echo ""

test_endpoint "/api/deviations" "GET" "All deviations"
test_endpoint "/api/deviations?employeeId=$SAMPLE_EMPLOYEE_ID" "GET" "Employee deviations"
test_endpoint "/api/deviations/$SAMPLE_DEVIATION_ID" "GET" "Single deviation"

echo "📋 TESTING LEAVE REQUEST ENDPOINTS:"
echo "==================================="
echo ""

test_endpoint "/api/leave-requests" "GET" "All leave requests"
test_endpoint "/api/leave-requests?employeeId=$SAMPLE_EMPLOYEE_ID" "GET" "Employee leave requests"
test_endpoint "/api/leave-requests/$SAMPLE_LEAVE_ID" "GET" "Single leave request"

echo "📋 TESTING MANAGER ENDPOINTS:"
echo "============================="
echo ""

test_endpoint "/api/manager/deviations/pending" "GET" "Manager pending deviations"
test_endpoint "/api/manager/leave-requests/pending" "GET" "Manager pending leave requests"

echo "📋 TESTING OTHER ENDPOINTS:"
echo "============================"
echo ""

test_endpoint "/api/time-balances/$SAMPLE_EMPLOYEE_ID" "GET" "Employee time balance"
test_endpoint "/api/payslips/$SAMPLE_EMPLOYEE_ID" "GET" "Employee payslips"

echo "📋 TESTING POTENTIALLY MISSING ENDPOINTS:"
echo "=========================================="
echo ""

# These are called by frontend but might not exist
test_endpoint "/api/employee/current" "GET" "Current employee (called by frontend)"
test_endpoint "/api/paxml/export" "GET" "PAXML export (called by frontend)"
test_endpoint "/api/paxml/import-schedules" "GET" "PAXML import schedules (called by frontend)"
test_endpoint "/api/paxml/export-with-schedules" "GET" "PAXML export with schedules (called by frontend)"
test_endpoint "/api/payslips/file/$SAMPLE_LEAVE_ID" "GET" "Payslip file download (called by frontend)"

echo "🎯 SUMMARY:"
echo "==========="
echo ""

# Count 404s
LOCAL_404_COUNT=$(curl -s "$LOCAL_URL/api/employee/current" -o /dev/null -w "%{http_code}"; curl -s "$LOCAL_URL/api/paxml/export" -o /dev/null -w "%{http_code}"; curl -s "$LOCAL_URL/api/paxml/import-schedules" -o /dev/null -w "%{http_code}"; curl -s "$LOCAL_URL/api/paxml/export-with-schedules" -o /dev/null -w "%{http_code}"; curl -s "$LOCAL_URL/api/payslips/file/1" -o /dev/null -w "%{http_code}") 
PROD_404_COUNT=$(curl -s "$PROD_URL/api/employee/current" -o /dev/null -w "%{http_code}"; curl -s "$PROD_URL/api/paxml/export" -o /dev/null -w "%{http_code}"; curl -s "$PROD_URL/api/paxml/import-schedules" -o /dev/null -w "%{http_code}"; curl -s "$PROD_URL/api/paxml/export-with-schedules" -o /dev/null -w "%{http_code}"; curl -s "$PROD_URL/api/payslips/file/1" -o /dev/null -w "%{http_code}")

404_LOCAL=$(echo "$LOCAL_404_COUNT" | grep -o "404" | wc -l)
404_PROD=$(echo "$PROD_404_COUNT" | grep -o "404" | wc -l)

if [ "$404_LOCAL" -gt 0 ] || [ "$404_PROD" -gt 0 ]; then
    printf "${RED}❌ POTENTIAL ISSUES FOUND:${NC}\n"
    echo "   Some endpoints return 404 - these might be missing implementations"
    echo ""
    printf "${YELLOW}🔧 RECOMMENDED ACTIONS:${NC}\n"
    echo "   1. Create missing endpoint files for 404 responses"
    echo "   2. Update frontend calls for unused endpoints"
    echo "   3. Add proper error handling for optional endpoints"
else
    printf "${GREEN}✅ ALL ENDPOINTS ACCESSIBLE${NC}\n"
    echo "   No major routing issues detected"
fi

echo ""
echo "🔗 Manual testing URLs:"
echo "   • Local: $LOCAL_URL"
echo "   • Production: $PROD_URL"