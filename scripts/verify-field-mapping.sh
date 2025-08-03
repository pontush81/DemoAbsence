#!/bin/bash

# 🔍 FIELD MAPPING VERIFICATION SCRIPT
# 
# Automatiserad verifiering av snake_case → camelCase transformation
# Baserat på Perplexity's rekommendationer för systematisk testning
# 
# Användning: ./scripts/verify-field-mapping.sh
# Krav: jq installerat, server körs på localhost:3000

set -e  # Exit on any error

echo "🔍 FIELD MAPPING VERIFICATION SCRIPT"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"
TOTAL_SNAKE_CASE=0
FAILED_ENDPOINTS=()

# Color codes för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint for snake_case fields
test_endpoint() {
    local name="$1"
    local url="$2"
    local jq_path="$3"
    
    echo -n "Testing ${name}... "
    
    # Make request and count snake_case fields
    local response=$(curl -s "${BASE_URL}${url}" 2>/dev/null)
    local snake_count=$(echo "${response}" | jq "${jq_path} | keys | map(select(contains(\"_\"))) | length" 2>/dev/null || echo "ERROR")
    
    if [ "$snake_count" = "ERROR" ]; then
        echo -e "${RED}ERROR${NC} (Failed to fetch or parse)"
        FAILED_ENDPOINTS+=("$name")
        return 1
    fi
    
    if [ "$snake_count" -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} (0 snake_case fields)"
    else
        echo -e "${RED}❌ FAIL${NC} (${snake_count} snake_case fields)"
        TOTAL_SNAKE_CASE=$((TOTAL_SNAKE_CASE + snake_count))
        FAILED_ENDPOINTS+=("$name")
        
        # Show which fields are problematic
        local problematic_fields=$(echo "${response}" | jq -r "${jq_path} | keys | map(select(contains(\"_\"))) | join(\", \")" 2>/dev/null)
        echo -e "   ${YELLOW}Problematic fields:${NC} ${problematic_fields}"
    fi
}

# Function to test payroll-critical functionality
test_payroll_critical() {
    echo ""
    echo -e "${BLUE}💰 PAYROLL-CRITICAL TESTS${NC}"
    echo "=========================="
    
    # Test manager comment persistence
    echo -n "Manager comments (deviation 35)... "
    local manager_comment=$(curl -s "${BASE_URL}/api/deviations/35" 2>/dev/null | jq -r '.managerComment // "NULL"')
    if [ "$manager_comment" != "NULL" ] && [ "$manager_comment" != "null" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Comment exists)"
    else
        echo -e "${YELLOW}⚠️  WARN${NC} (No manager comment found)"
    fi
    
    # Test vacation balance structure
    echo -n "Vacation balance structure... "
    local vacation_days=$(curl -s "${BASE_URL}/api/time-balances/E001" 2>/dev/null | jq '.vacationDays // 0')
    if [ "$vacation_days" != "0" ] && [ "$vacation_days" != "null" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Vacation days: ${vacation_days})"
    else
        echo -e "${YELLOW}⚠️  WARN${NC} (Vacation days not found or zero)"
    fi
    
    # Test nested object mapping
    echo -n "Nested objects (savedVacationDays)... "
    local saved_vacation=$(curl -s "${BASE_URL}/api/time-balances/E001" 2>/dev/null | jq '.savedVacationDays // {}')
    if [ "$saved_vacation" != "{}" ] && [ "$saved_vacation" != "null" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Nested object exists)"
    else
        echo -e "${YELLOW}⚠️  WARN${NC} (No saved vacation days found)"
    fi
}

# Function to check server availability
check_server() {
    echo -n "Checking server availability... "
    if curl -s "${BASE_URL}/api/employees" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not available at ${BASE_URL}${NC}"
        echo "Please start the server with: npm run dev"
        exit 1
    fi
}

# Main execution
echo "Starting field mapping verification..."
echo ""

# Check if server is running
check_server
echo ""

echo -e "${BLUE}🧪 SMOKE TEST - API ENDPOINTS${NC}"
echo "=============================="

# Test all critical endpoints
test_endpoint "Employees" "/api/employees" ".[0]"
test_endpoint "Deviations" "/api/deviations?employeeId=E001" ".[0]" 
test_endpoint "Leave Requests" "/api/leave-requests?employeeId=E001" ".[0]"
test_endpoint "Time Balances" "/api/time-balances/E001" "."
test_endpoint "Schedules" "/api/schedules?employeeId=E001" ".[0]"

# Test payroll-critical functionality
test_payroll_critical

# Summary
echo ""
echo "================================"
echo -e "${BLUE}📊 VERIFICATION SUMMARY${NC}"
echo "================================"

if [ ${#FAILED_ENDPOINTS[@]} -eq 0 ] && [ $TOTAL_SNAKE_CASE -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "✅ All endpoints return 100% camelCase fields"
    echo -e "✅ Field mapping transformation complete"
    echo -e "✅ No regressions detected"
    exit 0
else
    echo -e "${RED}❌ ISSUES DETECTED:${NC}"
    echo -e "   Failed endpoints: ${#FAILED_ENDPOINTS[@]}"
    echo -e "   Total snake_case fields: ${TOTAL_SNAKE_CASE}"
    
    if [ ${#FAILED_ENDPOINTS[@]} -gt 0 ]; then
        echo -e "   Problematic endpoints: ${FAILED_ENDPOINTS[*]}"
    fi
    
    echo ""
    echo -e "${YELLOW}🔧 RECOMMENDED ACTIONS:${NC}"
    echo "1. Check server/routes.ts for missing field mapping"
    echo "2. Verify server/supabase-rest-storage.ts mapping helpers"
    echo "3. Restart server after making changes"
    echo "4. Run this script again to verify fixes"
    
    exit 1
fi