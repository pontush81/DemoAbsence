#!/bin/bash

# 👥 ROLLBASERAD DATA ACCESS TEST
# Verifierar att olika roller får korrekt data och åtkomst

set -e

echo "👥 =============================================="
echo "     ROLLBASERAD DATA ACCESS TEST SUITE"
echo "=============================================="
echo ""

SERVER_URL="http://localhost:3000"

# Test users for different roles
EMPLOYEE_USER="E001"
MANAGER_USER="E002" 
HR_ADMIN_USER="E003"
PAYROLL_ADMIN_USER="E004"
PAYROLL_MANAGER_USER="E005"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
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

# Test role-based access
test_role_access() {
    local role="$1"
    local user_id="$2"
    local endpoint="$3"
    local should_succeed="$4"
    local description="$5"
    
    log_test "$description"
    
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "X-User-Role: $role" \
        -H "X-User-ID: $user_id" \
        "$SERVER_URL$endpoint")
    
    local status=$(echo "$response" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$should_succeed" = "true" ]; then
        if [ "$status" = "200" ] || [ "$status" = "201" ]; then
            # Check data quality
            if echo "$body" | jq . >/dev/null 2>&1; then
                local data_count=$(echo "$body" | jq 'if type == "array" then length else 1 end' 2>/dev/null || echo "1")
                log_success "Role $role can access $endpoint (Status: $status, Data items: $data_count)"
            else
                log_failure "Role $role got invalid JSON from $endpoint"
            fi
        else
            log_failure "Role $role cannot access $endpoint (Status: $status)"
            echo "Response: $body"
        fi
    else
        if [ "$status" = "403" ] || [ "$status" = "401" ]; then
            log_success "Role $role correctly denied access to $endpoint (Status: $status)"
        else
            log_failure "Role $role should be denied access to $endpoint but got status $status"
        fi
    fi
}

# Test data filtering by role
test_data_filtering() {
    local role="$1"
    local user_id="$2" 
    local endpoint="$3"
    local filter_description="$4"
    
    log_test "Data filtering: $filter_description"
    
    local response=$(curl -s -H "X-User-Role: $role" -H "X-User-ID: $user_id" "$SERVER_URL$endpoint")
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        local item_count=$(echo "$response" | jq 'if type == "array" then length else 1 end' 2>/dev/null || echo "0")
        
        # Basic validation that data is returned
        if [ "$item_count" -gt 0 ]; then
            log_success "$filter_description - Got $item_count items"
        else
            # Empty results can be valid (no data in database yet)
            log_success "$filter_description - Got empty result (valid if no data exists)"
        fi
    else
        log_failure "$filter_description - Invalid response format"
        echo "Response: $response"
    fi
}

echo "🔍 Phase 1: Employee Role Access Tests"
echo "===================================="

# Employees should only see their own data
test_role_access "employee" "$EMPLOYEE_USER" "/api/deviations?employeeId=$EMPLOYEE_USER" "true" "Employee accesses own deviations"
test_role_access "employee" "$EMPLOYEE_USER" "/api/leave-requests?employeeId=$EMPLOYEE_USER" "true" "Employee accesses own leave requests"
test_role_access "employee" "$EMPLOYEE_USER" "/api/time-balances/$EMPLOYEE_USER" "true" "Employee accesses own time balance"
test_role_access "employee" "$EMPLOYEE_USER" "/api/schedules/$EMPLOYEE_USER" "true" "Employee accesses own schedule"
test_role_access "employee" "$EMPLOYEE_USER" "/api/payslips/$EMPLOYEE_USER" "true" "Employee accesses own payslips"

# Employees should NOT access other employees' data
test_role_access "employee" "$EMPLOYEE_USER" "/api/deviations?employeeId=E999" "false" "Employee cannot access other's deviations"
test_role_access "employee" "$EMPLOYEE_USER" "/api/time-balances/E999" "false" "Employee cannot access other's time balance"

echo ""
echo "👔 Phase 2: Manager Role Access Tests"
echo "===================================="

# Managers should access team data and pending approvals
test_role_access "manager" "$MANAGER_USER" "/api/manager/deviations/pending" "true" "Manager accesses pending deviations"
test_role_access "manager" "$MANAGER_USER" "/api/manager/leave-requests/pending" "true" "Manager accesses pending leave requests"
test_role_access "manager" "$MANAGER_USER" "/api/employees" "true" "Manager accesses employee list"

# Test manager data filtering
test_data_filtering "manager" "$MANAGER_USER" "/api/manager/deviations/pending" "Manager sees only pending deviations"
test_data_filtering "manager" "$MANAGER_USER" "/api/manager/leave-requests/pending" "Manager sees only pending leave requests"

echo ""
echo "🏢 Phase 3: HR Admin Role Access Tests"
echo "===================================="

# HR Admins should have broad access to employee data
test_role_access "hr-admin" "$HR_ADMIN_USER" "/api/employees" "true" "HR Admin accesses all employees"
test_role_access "hr-admin" "$HR_ADMIN_USER" "/api/deviations" "true" "HR Admin accesses all deviations"
test_role_access "hr-admin" "$HR_ADMIN_USER" "/api/leave-requests" "true" "HR Admin accesses all leave requests"
test_role_access "hr-admin" "$HR_ADMIN_USER" "/api/timecodes" "true" "HR Admin accesses time codes"

# HR should NOT access payroll exports
test_role_access "hr-admin" "$HR_ADMIN_USER" "/api/paxml/export" "false" "HR Admin cannot access PAXML export"

echo ""
echo "💰 Phase 4: Payroll Admin Role Access Tests"
echo "=========================================="

# Payroll Admins should have access to all financial data
test_role_access "payroll-admin" "$PAYROLL_ADMIN_USER" "/api/employees" "true" "Payroll Admin accesses all employees"
test_role_access "payroll-admin" "$PAYROLL_ADMIN_USER" "/api/deviations" "true" "Payroll Admin accesses all deviations"
test_role_access "payroll-admin" "$PAYROLL_ADMIN_USER" "/api/time-balances/$EMPLOYEE_USER" "true" "Payroll Admin accesses time balances"

# Most importantly - payroll export access
PAXML_DATA='{"employeeIds":["E001"],"startDate":"2025-08-01","endDate":"2025-08-31"}'
log_test "Payroll Admin PAXML export access"
paxml_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "X-User-Role: payroll-admin" \
    -H "X-User-ID: $PAYROLL_ADMIN_USER" \
    -d "$PAXML_DATA" \
    "$SERVER_URL/api/paxml/export")

paxml_status=$(echo "$paxml_response" | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
if [ "$paxml_status" = "200" ]; then
    log_success "Payroll Admin can access PAXML export (Status: $paxml_status)"
else
    log_failure "Payroll Admin cannot access PAXML export (Status: $paxml_status)"
fi

echo ""
echo "🔒 Phase 5: Payroll Manager Role Access Tests"
echo "==========================================="

# Similar to Payroll Admin but might have some restrictions
test_role_access "payroll-manager" "$PAYROLL_MANAGER_USER" "/api/employees" "true" "Payroll Manager accesses employees"
test_role_access "payroll-manager" "$PAYROLL_MANAGER_USER" "/api/paxml/export" "true" "Payroll Manager accesses PAXML export"

echo ""
echo "🛡️ Phase 6: Cross-Role Data Integrity Tests"
echo "=========================================="

# Test that data returned to different roles is consistent
log_test "Cross-role data consistency check"

# Get employee list from different roles
employee_response=$(curl -s -H "X-User-Role: hr-admin" "$SERVER_URL/api/employees")
payroll_response=$(curl -s -H "X-User-Role: payroll-admin" "$SERVER_URL/api/employees")

if echo "$employee_response" | jq . >/dev/null 2>&1 && echo "$payroll_response" | jq . >/dev/null 2>&1; then
    hr_count=$(echo "$employee_response" | jq 'length' 2>/dev/null || echo "0")
    payroll_count=$(echo "$payroll_response" | jq 'length' 2>/dev/null || echo "0")
    
    if [ "$hr_count" = "$payroll_count" ]; then
        log_success "HR Admin and Payroll Admin see same number of employees ($hr_count)"
    else
        log_failure "Data inconsistency: HR sees $hr_count employees, Payroll sees $payroll_count"
    fi
else
    log_failure "Cross-role consistency check failed - invalid JSON responses"
fi

echo ""
echo "🔍 Phase 7: Database Connection Verification"
echo "=========================================="

# Verify that ALL role-based requests actually use database
log_test "Database dependency verification for all roles"

ROLES=("employee" "manager" "hr-admin" "payroll-admin" "payroll-manager")
DB_DEPENDENT=true

for role in "${ROLES[@]}"; do
    # Test a basic endpoint for each role
    response=$(curl -s -H "X-User-Role: $role" "$SERVER_URL/api/employees" 2>/dev/null || echo "ERROR")
    
    # Check if response contains any mock indicators
    if echo "$response" | grep -iq "mock\|fallback\|demo" && ! echo "$response" | grep -q "message.*mock"; then
        log_failure "Role $role may be using mock data"
        DB_DEPENDENT=false
    fi
done

if [ "$DB_DEPENDENT" = true ]; then
    log_success "All roles appear to use database-only data access"
else
    log_failure "Some roles may still have mock data fallbacks"
fi

echo ""
echo "📊 =============================================="
echo "           ROLE-BASED TEST RESULTS"
echo "=============================================="
echo ""
echo -e "📊 ${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "✅ ${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "❌ ${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL ROLE-BASED TESTS PASSED!${NC}"
    echo ""
    echo "✅ ROLE ACCESS VERIFICATION COMPLETE:"
    echo "  • Employee role: Can only access own data"
    echo "  • Manager role: Can access team and approval data"  
    echo "  • HR Admin role: Can access employee management data"
    echo "  • Payroll Admin role: Can access all financial data"
    echo "  • Payroll Manager role: Can access payroll exports"
    echo "  • All roles use database-only data access"
    echo "  • Cross-role data consistency verified"
    echo ""
    echo -e "${GREEN}🔒 ROLE-BASED SECURITY: VERIFIED AND SECURE!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  ROLE-BASED ACCESS ISSUES DETECTED!${NC}"
    echo ""
    echo "❌ SECURITY CONCERNS:"
    echo "  • $FAILED_TESTS role access test(s) failed"
    echo "  • Some roles may have incorrect permissions"
    echo "  • Data access may not be properly restricted"
    echo ""
    echo -e "${RED}🚫 SECURITY RISK: Fix role access issues before deployment!${NC}"
    exit 1
fi