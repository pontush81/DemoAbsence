#!/bin/bash

echo "🧪 KOMPLETT ENDPOINT TEST SUITE - SUPABASE DATA"
echo "================================================="
echo "Testar alla endpoints systematiskt mot Supabase"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"
TEST_EMPLOYEE="E001"
TEST_MANAGER="E005"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_test() {
    echo -e "${BLUE}🔍 TEST $((TOTAL_TESTS + 1)): $1${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_success() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_error() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

test_endpoint() {
    local endpoint="$1"
    local expected_type="$2"
    local description="$3"
    
    print_test "$description"
    
    local response=$(curl -s "$BASE_URL/$endpoint")
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$endpoint")
    
    if [ "$http_code" != "200" ]; then
        print_error "HTTP $http_code - $endpoint"
        echo "Response: $response" | head -c 200
        echo ""
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$response" | jq empty 2>/dev/null; then
        print_error "$endpoint - Invalid JSON response"
        return 1
    fi
    
    # Check response type
    local actual_type=$(echo "$response" | jq -r 'type')
    if [ "$expected_type" = "array" ] && [ "$actual_type" != "array" ]; then
        print_error "$endpoint - Expected array, got $actual_type"
        return 1
    elif [ "$expected_type" = "object" ] && [ "$actual_type" != "object" ]; then
        print_error "$endpoint - Expected object, got $actual_type"
        return 1
    fi
    
    print_success "$endpoint - Response OK"
    return 0
}

check_field_mapping() {
    local endpoint="$1"
    local description="$2"
    
    print_test "$description"
    
    local response=$(curl -s "$BASE_URL/$endpoint")
    local sample_item=$(echo "$response" | jq -r 'if type == "array" then .[0] else . end')
    
    # Check for snake_case fields that should be mapped
    local snake_fields=$(echo "$sample_item" | jq -r 'keys[]' 2>/dev/null | grep -E "_" || echo "")
    local has_camel_equiv=true
    
    if [ ! -z "$snake_fields" ]; then
        echo "  Snake_case fields found:"
        for field in $snake_fields; do
            echo "    - $field"
            # Check if camelCase equivalent exists
            local camel_field=$(echo "$field" | sed 's/_\([a-z]\)/\U\1/g')
            local has_camel=$(echo "$sample_item" | jq -r "has(\"$camel_field\")")
            if [ "$has_camel" = "false" ]; then
                has_camel_equiv=false
            fi
        done
        
        if [ "$has_camel_equiv" = "true" ]; then
            print_warning "$endpoint - Has snake_case fields but camelCase mapping exists"
        else
            print_error "$endpoint - Missing camelCase mapping for some fields"
        fi
    else
        print_success "$endpoint - No snake_case fields found"
    fi
}

# =============================================================================
# BASIC ENDPOINT TESTS
# =============================================================================

echo "📋 PHASE 1: BASIC ENDPOINT AVAILABILITY"
echo "======================================="

test_endpoint "test" "object" "Server health check"
test_endpoint "employees" "array" "Get all employees"
test_endpoint "employees/$TEST_EMPLOYEE" "object" "Get employee by ID"
test_endpoint "timecodes" "array" "Get all time codes"
test_endpoint "schedules?employeeId=$TEST_EMPLOYEE" "array" "Get employee schedules"
test_endpoint "time-balances/$TEST_EMPLOYEE" "object" "Get employee time balance"
test_endpoint "payslips/$TEST_EMPLOYEE" "array" "Get employee payslips"
test_endpoint "deviations?employeeId=$TEST_EMPLOYEE" "array" "Get employee deviations"
test_endpoint "leave-requests?employeeId=$TEST_EMPLOYEE" "array" "Get employee leave requests"

echo ""

# =============================================================================
# FIELD MAPPING TESTS
# =============================================================================

echo "🔄 PHASE 2: FIELD MAPPING CONSISTENCY"
echo "====================================="

check_field_mapping "employees" "Employee field mapping"
check_field_mapping "timecodes" "Time codes field mapping"
check_field_mapping "schedules?employeeId=$TEST_EMPLOYEE" "Schedules field mapping"
check_field_mapping "time-balances/$TEST_EMPLOYEE" "Time balance field mapping"
check_field_mapping "deviations?employeeId=$TEST_EMPLOYEE" "Deviations field mapping"
check_field_mapping "leave-requests?employeeId=$TEST_EMPLOYEE" "Leave requests field mapping"

echo ""

# =============================================================================
# CRUD OPERATION TESTS
# =============================================================================

echo "✏️  PHASE 3: CRUD OPERATIONS"
echo "============================"

# Test deviation creation
print_test "Create new deviation"
DEV_RESPONSE=$(curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "'$TEST_EMPLOYEE'",
    "date": "2025-08-24",
    "timeCode": "200",
    "startTime": "18:00",
    "endTime": "20:00",
    "comment": "TEST: Endpoint test övertid"
  }')

DEV_ID=$(echo "$DEV_RESPONSE" | jq -r '.id // empty')
if [ ! -z "$DEV_ID" ] && [ "$DEV_ID" != "null" ]; then
    print_success "Deviation created with ID: $DEV_ID"
else
    print_error "Failed to create deviation"
    echo "Response: $DEV_RESPONSE"
fi

# Test leave request creation  
print_test "Create new leave request"
LEAVE_RESPONSE=$(curl -s -X POST "$BASE_URL/leave-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "'$TEST_EMPLOYEE'",
    "startDate": "2025-08-26",
    "endDate": "2025-08-26",
    "leaveType": "vacation",
    "comment": "TEST: Endpoint test ledighet"
  }')

LEAVE_ID=$(echo "$LEAVE_RESPONSE" | jq -r '.id // empty')
if [ ! -z "$LEAVE_ID" ] && [ "$LEAVE_ID" != "null" ]; then
    print_success "Leave request created with ID: $LEAVE_ID"
else
    print_error "Failed to create leave request"
    echo "Response: $LEAVE_RESPONSE"
fi

echo ""

# =============================================================================
# MANAGER OPERATIONS TESTS
# =============================================================================

echo "👔 PHASE 4: MANAGER OPERATIONS"
echo "==============================="

if [ ! -z "$DEV_ID" ] && [ "$DEV_ID" != "null" ]; then
    # Test deviation approval
    print_test "Approve deviation with manager comment"
    APPROVE_RESPONSE=$(curl -s -X POST "$BASE_URL/manager/deviations/$DEV_ID/approve" \
      -H "Content-Type: application/json" \
      -d '{
        "comment": "TEST: Godkänd övertid - endpoint test",
        "managerId": "'$TEST_MANAGER'"
      }')
    
    # Check if approval worked and comment persisted
    sleep 1
    APPROVED_DEV=$(curl -s "$BASE_URL/deviations/$DEV_ID")
    DEV_STATUS=$(echo "$APPROVED_DEV" | jq -r '.status')
    DEV_COMMENT=$(echo "$APPROVED_DEV" | jq -r '.managerComment // "NULL"')
    
    if [ "$DEV_STATUS" = "approved" ] && [ "$DEV_COMMENT" != "NULL" ] && [ "$DEV_COMMENT" != "null" ]; then
        print_success "Deviation approved with manager comment: $DEV_COMMENT"
    else
        print_error "Deviation approval failed - Status: $DEV_STATUS, Comment: $DEV_COMMENT"
    fi
fi

if [ ! -z "$LEAVE_ID" ] && [ "$LEAVE_ID" != "null" ]; then
    # Test leave request rejection
    print_test "Reject leave request with manager comment"
    REJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/manager/leave-requests/$LEAVE_ID/reject" \
      -H "Content-Type: application/json" \
      -d '{
        "comment": "TEST: Avslås - endpoint test behöver mer planering",
        "managerId": "'$TEST_MANAGER'"
      }')
    
    # Check if rejection worked and comment persisted
    sleep 1
    REJECTED_LEAVE=$(curl -s "$BASE_URL/leave-requests/$LEAVE_ID")
    LEAVE_STATUS=$(echo "$REJECTED_LEAVE" | jq -r '.status')
    LEAVE_COMMENT=$(echo "$REJECTED_LEAVE" | jq -r '.managerComment // "NULL"')
    
    if [ "$LEAVE_STATUS" = "rejected" ] && [ "$LEAVE_COMMENT" != "NULL" ] && [ "$LEAVE_COMMENT" != "null" ]; then
        print_success "Leave request rejected with manager comment: $LEAVE_COMMENT"
    else
        print_error "Leave request rejection failed - Status: $LEAVE_STATUS, Comment: $LEAVE_COMMENT"
    fi
fi

echo ""

# =============================================================================
# FILTER TESTS
# =============================================================================

echo "🔍 PHASE 5: FILTER FUNCTIONALITY"
echo "================================"

# Test period filters for leave requests
print_test "Leave requests 'upcoming' filter"
UPCOMING_LEAVES=$(curl -s "$BASE_URL/leave-requests?employeeId=$TEST_EMPLOYEE&period=upcoming")
UPCOMING_COUNT=$(echo "$UPCOMING_LEAVES" | jq '. | length')
if [ "$UPCOMING_COUNT" -gt 0 ]; then
    print_success "Upcoming filter returned $UPCOMING_COUNT leave requests"
else
    print_warning "Upcoming filter returned no results (may be expected)"
fi

print_test "Leave requests 'all' filter"
ALL_LEAVES=$(curl -s "$BASE_URL/leave-requests?employeeId=$TEST_EMPLOYEE&period=all")
ALL_COUNT=$(echo "$ALL_LEAVES" | jq '. | length')
if [ "$ALL_COUNT" -gt 0 ]; then
    print_success "All filter returned $ALL_COUNT leave requests"
else
    print_error "All filter returned no results"
fi

# Test status filters for deviations
print_test "Deviations status filter - pending"
PENDING_DEVS=$(curl -s "$BASE_URL/deviations?employeeId=$TEST_EMPLOYEE&status=pending")
PENDING_COUNT=$(echo "$PENDING_DEVS" | jq '. | length')
print_success "Pending deviations filter returned $PENDING_COUNT results"

print_test "Deviations status filter - approved"
APPROVED_DEVS=$(curl -s "$BASE_URL/deviations?employeeId=$TEST_EMPLOYEE&status=approved")
APPROVED_COUNT=$(echo "$APPROVED_DEVS" | jq '. | length')
print_success "Approved deviations filter returned $APPROVED_COUNT results"

echo ""

# =============================================================================
# VACATION BALANCE TEST
# =============================================================================

echo "💰 PHASE 6: VACATION BALANCE UPDATES"
echo "===================================="

print_test "Vacation balance before approval"
BALANCE_BEFORE=$(curl -s "$BASE_URL/time-balances/$TEST_EMPLOYEE" | jq -r '.vacationDays')
echo "  Balance before: $BALANCE_BEFORE days"

# Create and approve a vacation request
print_test "Create and approve vacation request"
VACATION_RESPONSE=$(curl -s -X POST "$BASE_URL/leave-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "'$TEST_EMPLOYEE'",
    "startDate": "2025-08-27",
    "endDate": "2025-08-27",
    "leaveType": "vacation",
    "comment": "TEST: Vacation balance test"
  }')

VACATION_ID=$(echo "$VACATION_RESPONSE" | jq -r '.id // empty')
if [ ! -z "$VACATION_ID" ] && [ "$VACATION_ID" != "null" ]; then
    # Approve the vacation
    curl -s -X POST "$BASE_URL/manager/leave-requests/$VACATION_ID/approve" \
      -H "Content-Type: application/json" \
      -d '{
        "comment": "TEST: Approved for balance test",
        "managerId": "'$TEST_MANAGER'"
      }' > /dev/null
    
    sleep 2  # Give time for balance update
    
    print_test "Vacation balance after approval"
    BALANCE_AFTER=$(curl -s "$BASE_URL/time-balances/$TEST_EMPLOYEE" | jq -r '.vacationDays')
    echo "  Balance after: $BALANCE_AFTER days"
    
    if [ "$BALANCE_BEFORE" != "$BALANCE_AFTER" ]; then
        print_success "Vacation balance updated: $BALANCE_BEFORE → $BALANCE_AFTER"
    else
        print_error "Vacation balance not updated after approval"
    fi
else
    print_error "Failed to create vacation request for balance test"
fi

echo ""

# =============================================================================
# SUMMARY
# =============================================================================

echo "📊 TEST SUMMARY"
echo "==============="
echo -e "Total tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Supabase integration working correctly.${NC}"
else
    echo -e "${RED}❌ $FAILED_TESTS test(s) failed. Review issues above.${NC}"
fi

echo ""
echo "🔧 RECOMMENDATIONS:"
if [ $FAILED_TESTS -gt 0 ]; then
    echo "• Fix failing endpoints before removing mock data fallback"
    echo "• Review field mapping for snake_case fields"
    echo "• Test manager operations thoroughly"
fi
echo "• Monitor logs for any Supabase connection issues"
echo "• Verify environment variables are correctly set"