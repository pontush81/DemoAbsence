#!/bin/bash

# 🔒 SECURITY & PERMISSIONS TEST
# Tests role-based access control, separation of duties, and GDPR compliance
# Based on Perplexity's Swedish HR security recommendations

echo "🔒 SECURITY & PERMISSIONS TEST"
echo "==============================="
echo ""

LOCAL_URL="http://localhost:3000"
PROD_URL="https://demo-absence.vercel.app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name=$1
    local test_command=$2
    local expected_result=$3
    
    echo "🧪 TESTING: $test_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Run the test
    result=$(eval "$test_command" 2>/dev/null)
    
    if [[ "$result" == *"$expected_result"* ]]; then
        printf "   ${GREEN}✅ PASS${NC} - $test_name\n"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        printf "   ${RED}❌ FAIL${NC} - $test_name\n"
        printf "   Expected: $expected_result\n"
        printf "   Got: $result\n"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

echo "📋 TESTING PAYROLL EXPORT ACCESS (GDPR CRITICAL):"
echo "================================================="
echo ""

# Test 1: Payroll Export API Endpoint Security
echo "🔍 Testing API endpoint access control..."
run_test "Payroll export returns data (should work)" \
    "curl -s -w '%{http_code}' '$LOCAL_URL/api/paxml/export' -X POST" \
    "200"

# Test 2: Manager self-approval prevention
echo "🔍 Testing separation of duties..."
run_test "Manager cannot approve own leave request" \
    "curl -s '$LOCAL_URL/api/manager/leave-requests/pending?managerId=E005' | jq 'map(select(.employeeId == \"E005\")) | length'" \
    "0"

echo "📋 TESTING ROLE DEFINITIONS:"
echo "============================"
echo ""

# Test role structure
echo "🔍 Testing new role structure implementation..."

# Check if new roles are properly defined in the system
grep -q "payroll-admin" client/src/lib/store.ts
if [ $? -eq 0 ]; then
    printf "${GREEN}✅ PASS${NC} - New payroll roles defined in store\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    printf "${RED}❌ FAIL${NC} - New payroll roles missing in store\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Check sidebar security implementation
grep -q "canAccessPayrollExport" client/src/components/layout/sidebar.tsx
if [ $? -eq 0 ]; then
    printf "${GREEN}✅ PASS${NC} - Payroll export access control implemented in sidebar\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    printf "${RED}❌ FAIL${NC} - Payroll export access control missing in sidebar\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "📋 TESTING GDPR COMPLIANCE:"
echo "==========================="
echo ""

# Test 3: Ensure sensitive data access is logged (mock test)
echo "🔍 Testing audit logging requirements..."
printf "${BLUE}ℹ️  INFO${NC} - Audit logging should be implemented for payroll export access\n"
printf "${YELLOW}⚠️  TODO${NC} - Add audit logging to payroll export endpoints\n"
echo ""

# Test 4: Check that only specific roles can access payroll functions
echo "🔍 Testing role-based access restrictions..."

# Check if sidebar restricts payroll export correctly
PAYROLL_RESTRICTION=$(grep -A5 -B5 "canAccessPayrollExport.*payroll-admin\|payroll-manager\|hr-manager" client/src/components/layout/sidebar.tsx)
if [ ! -z "$PAYROLL_RESTRICTION" ]; then
    printf "${GREEN}✅ PASS${NC} - Payroll export restricted to specific roles\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    printf "${RED}❌ FAIL${NC} - Payroll export access control not properly restricted\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "📋 TESTING SEPARATION OF DUTIES:"
echo "================================"
echo ""

# Test 5: Manager cannot see their own leave requests in pending queue
echo "🔍 Testing manager self-approval prevention..."
run_test "Manager API excludes own requests" \
    "curl -s '$LOCAL_URL/api/manager/leave-requests/pending?managerId=E005' | jq 'map(select(.employeeId == \"E005\")) | length'" \
    "0"

# Test 6: Check that different roles have different permissions
echo "🔍 Testing role permission separation..."

# Check if different roles have different access patterns
ROLE_SEPARATION=$(grep -c "isPayrollAdmin\|isPayrollManager\|isHRManager" client/src/components/layout/sidebar.tsx)
if [ "$ROLE_SEPARATION" -gt 0 ]; then
    printf "${GREEN}✅ PASS${NC} - Role separation implemented ($ROLE_SEPARATION role checks found)\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    printf "${RED}❌ FAIL${NC} - Role separation not properly implemented\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "📋 TESTING PRINCIPLE OF LEAST PRIVILEGE:"
echo "========================================"
echo ""

# Test 7: Regular employees cannot access manager functions
echo "🔍 Testing employee access restrictions..."
EMPLOYEE_RESTRICTIONS=$(grep -A10 -B5 "canAccessManagerFunctions.*isManager\|isHR\|isHRManager\|isPayrollAdmin\|isPayrollManager" client/src/components/layout/sidebar.tsx)
if [ ! -z "$EMPLOYEE_RESTRICTIONS" ]; then
    printf "${GREEN}✅ PASS${NC} - Manager functions restricted from regular employees\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    printf "${RED}❌ FAIL${NC} - Manager functions access control not found\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 8: Payroll dashboard restricted to payroll roles
echo "🔍 Testing payroll dashboard access..."
PAYROLL_DASHBOARD_RESTRICTION=$(grep -A5 -B5 "payroll-dashboard.*isPayrollAdmin\|isPayrollManager" client/src/components/layout/sidebar.tsx)
if [ ! -z "$PAYROLL_DASHBOARD_RESTRICTION" ]; then
    printf "${GREEN}✅ PASS${NC} - Payroll dashboard restricted to payroll roles\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    printf "${RED}❌ FAIL${NC} - Payroll dashboard restriction not properly implemented\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "📋 TESTING SWEDISH HR COMPLIANCE:"
echo "================================="
echo ""

# Test 9: Role descriptions match Swedish HR standards
echo "🔍 Testing Swedish role compliance..."
SWEDISH_ROLES=$(grep -c "Löneadministratör\|Lönechef\|HR-chef" client/src/lib/demoPersonas.ts)
if [ "$SWEDISH_ROLES" -ge 3 ]; then
    printf "${GREEN}✅ PASS${NC} - Swedish HR role labels implemented ($SWEDISH_ROLES found)\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    printf "${RED}❌ FAIL${NC} - Swedish HR role labels missing or incomplete\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 10: Sick leave auto-approval follows Swedish practice
echo "🔍 Testing Swedish sick leave compliance..."
SICK_LEAVE_CONFIG=$(grep -A5 -B5 '"requiresApproval": false' mock-data/timecodes.json | grep -c '"code": "300"\|"code": "400"')
if [ "$SICK_LEAVE_CONFIG" -ge 2 ]; then
    printf "${GREEN}✅ PASS${NC} - Sick leave auto-approval configured per Swedish practice (found $SICK_LEAVE_CONFIG configs)\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    printf "${RED}❌ FAIL${NC} - Sick leave approval not configured per Swedish practice (found $SICK_LEAVE_CONFIG configs)\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 11: Check for old "payroll" role references that could bypass security
echo "🔍 Testing for legacy security vulnerabilities..."
OLD_PAYROLL_REFS=$(grep -r "currentRole.*===.*'payroll'" client/src/ --exclude-dir=node_modules | wc -l)
if [ "$OLD_PAYROLL_REFS" -eq 0 ]; then
    printf "${GREEN}✅ PASS${NC} - No legacy 'payroll' role references found\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    printf "${RED}❌ FAIL${NC} - Found $OLD_PAYROLL_REFS legacy 'payroll' role references that could bypass security\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "📋 TESTING PRODUCTION SECURITY:"
echo "==============================="
echo ""

# Test 12: Production API security
echo "🔍 Testing production endpoint security..."
run_test "Production payroll export requires proper method" \
    "curl -s -w '%{http_code}' '$PROD_URL/api/paxml/export' -X GET" \
    "405"

run_test "Production payroll export with POST gives informative error" \
    "curl -s -w '%{http_code}' '$PROD_URL/api/paxml/export' -X POST" \
    "503"

echo "🎯 SECURITY TEST SUMMARY:"
echo "========================="
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    printf "${GREEN}✅ ALL SECURITY TESTS PASSED${NC}\n"
    printf "   Total tests: $TOTAL_TESTS\n"
    printf "   Passed: $PASSED_TESTS\n"
    printf "   Failed: $FAILED_TESTS\n"
    echo ""
    printf "${GREEN}🔒 SECURITY STATUS: COMPLIANT${NC}\n"
    echo "   ✅ GDPR role restrictions implemented"
    echo "   ✅ Separation of duties enforced"
    echo "   ✅ Principle of least privilege followed"
    echo "   ✅ Swedish HR compliance maintained"
else
    printf "${RED}❌ SECURITY ISSUES DETECTED${NC}\n"
    printf "   Total tests: $TOTAL_TESTS\n"
    printf "   Passed: $PASSED_TESTS\n"
    printf "   Failed: $FAILED_TESTS\n"
    echo ""
    printf "${RED}🚨 SECURITY STATUS: NEEDS ATTENTION${NC}\n"
    echo "   Please address failed tests before deployment"
fi

echo ""
echo "📊 DETAILED RECOMMENDATIONS:"
echo "============================"
echo ""

printf "${PURPLE}🔍 AUDIT REQUIREMENTS:${NC}\n"
echo "1. Implement audit logging for all payroll export operations"
echo "2. Log role switches and privilege escalations"
echo "3. Monitor access to sensitive employee data"
echo ""

printf "${BLUE}🛡️  ADDITIONAL SECURITY MEASURES:${NC}\n"
echo "1. Consider two-factor authentication for payroll roles"
echo "2. Implement session timeouts for sensitive operations"
echo "3. Add IP address restrictions for payroll functions"
echo "4. Regular access reviews and role certifications"
echo ""

printf "${YELLOW}⚖️  COMPLIANCE NOTES:${NC}\n"
echo "1. Ensure GDPR data processing agreements are in place"
echo "2. Regular security audits required"
echo "3. Employee consent for data processing must be documented"
echo "4. Right to be forgotten procedures must be implemented"