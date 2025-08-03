#!/bin/bash

echo "🧪 KRITISK DATA INTEGRITET TEST SUITE"
echo "====================================="
echo "Testar alla kritiska data operationer innan mock rensning"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"
TEST_EMPLOYEE="E001"
TEST_MANAGER="E005"

# Helper functions
print_test() {
    echo -e "${YELLOW}🔍 TEST: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test 1: Manager Comment Persistering (Känt Problem)
print_test "1. Manager Comment Persistering"
echo "Skapar ny leave request..."
LEAVE_ID=$(curl -s -X POST "$BASE_URL/leave-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "'$TEST_EMPLOYEE'",
    "startDate": "2025-08-20",
    "endDate": "2025-08-20",
    "leaveType": "vacation",
    "comment": "TEST: Manager comment test"
  }' | jq -r '.id')

echo "Created leave request: $LEAVE_ID"

echo "Försöker reject med manager comment..."
curl -s -X POST "$BASE_URL/manager/leave-requests/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "id": '$LEAVE_ID',
    "reason": "TEST: Detta är min manager kommentar",
    "managerId": "'$TEST_MANAGER'"
  }' > /dev/null

echo "Kontrollerar om manager comment sparades..."
MANAGER_COMMENT=$(curl -s "$BASE_URL/leave-requests/$LEAVE_ID" | jq -r '.managerComment // "NULL"')
STATUS=$(curl -s "$BASE_URL/leave-requests/$LEAVE_ID" | jq -r '.status')

echo "Status: $STATUS"
echo "Manager Comment: $MANAGER_COMMENT"

if [ "$MANAGER_COMMENT" = "NULL" ] || [ "$MANAGER_COMMENT" = "null" ]; then
    print_error "Manager comment sparas INTE! Kritiskt problem."
else
    print_success "Manager comment sparas korrekt: $MANAGER_COMMENT"
fi
echo ""

# Test 2: Snake_case vs CamelCase Field Mapping
print_test "2. Field Mapping Test (snake_case ↔ camelCase)"
echo "Kontrollerar alla endpoints för field mapping..."

ENDPOINTS=(
    "employees"
    "timecodes" 
    "leave-requests?employeeId=$TEST_EMPLOYEE"
    "deviations?employeeId=$TEST_EMPLOYEE"
    "schedules?employeeId=$TEST_EMPLOYEE"
    "time-balances/$TEST_EMPLOYEE"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Testing: $endpoint"
    RESPONSE=$(curl -s "$BASE_URL/$endpoint")
    
    # Check for common snake_case fields that should be mapped
    SNAKE_FIELDS=$(echo "$RESPONSE" | jq -r 'if type == "array" then .[0] else . end | keys[]' 2>/dev/null | grep -E "_" || echo "")
    
    if [ ! -z "$SNAKE_FIELDS" ]; then
        print_warning "Snake_case fields found in $endpoint:"
        echo "$SNAKE_FIELDS" | sed 's/^/  - /'
    else
        print_success "No snake_case fields in $endpoint"
    fi
done
echo ""

# Test 3: Time Balance Update Test
print_test "3. Time Balance Update Test"
echo "Kontrollerar vacation balance före och efter godkännande..."

BEFORE_BALANCE=$(curl -s "$BASE_URL/time-balances/$TEST_EMPLOYEE" | jq -r '.vacationDays')
echo "Vacation balance före: $BEFORE_BALANCE"

# Create and approve a vacation request
VACATION_ID=$(curl -s -X POST "$BASE_URL/leave-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "'$TEST_EMPLOYEE'",
    "startDate": "2025-08-25",
    "endDate": "2025-08-25", 
    "leaveType": "vacation",
    "comment": "TEST: Balance update test"
  }' | jq -r '.id')

curl -s -X POST "$BASE_URL/manager/leave-requests/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "id": '$VACATION_ID',
    "comment": "TEST: Approved for balance test",
    "managerId": "'$TEST_MANAGER'"
  }' > /dev/null

sleep 2  # Give it time to process

AFTER_BALANCE=$(curl -s "$BASE_URL/time-balances/$TEST_EMPLOYEE" | jq -r '.vacationDays')
echo "Vacation balance efter: $AFTER_BALANCE"

if [ "$BEFORE_BALANCE" = "$AFTER_BALANCE" ]; then
    print_error "Vacation balance uppdaterades INTE efter godkännande!"
else
    print_success "Vacation balance uppdaterades: $BEFORE_BALANCE → $AFTER_BALANCE"
fi
echo ""

# Test 4: Date Field Consistency
print_test "4. Date Field Consistency Test"
echo "Kontrollerar datum fält i rejected leave request..."

DATE_FIELDS=$(curl -s "$BASE_URL/leave-requests/$LEAVE_ID" | jq -r '{
    status: .status,
    rejectedAt: .rejectedAt,
    rejected_at: .rejected_at,
    approvedAt: .approvedAt,
    approved_at: .approved_at,
    submittedAt: .submittedAt,
    submitted_at: .submitted_at
}')

echo "Date fields:"
echo "$DATE_FIELDS"

# Check if we have both snake_case and camelCase versions
HAS_SNAKE=$(echo "$DATE_FIELDS" | jq -r 'has("rejected_at")')
HAS_CAMEL=$(echo "$DATE_FIELDS" | jq -r 'has("rejectedAt")')

if [ "$HAS_SNAKE" = "true" ] && [ "$HAS_CAMEL" = "true" ]; then
    print_warning "Både snake_case och camelCase datum fält existerar"
elif [ "$HAS_CAMEL" = "true" ]; then
    print_success "Endast camelCase datum fält (korrekt)"
else
    print_error "Endast snake_case datum fält (problem)"
fi
echo ""

# Test 5: Deviation Status Update Test
print_test "5. Deviation Status Update Test"
echo "Testar deviation approval workflow..."

DEV_ID=$(curl -s -X POST "$BASE_URL/deviations" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "'$TEST_EMPLOYEE'",
    "date": "2025-08-21",
    "timeCode": "300",
    "startTime": "08:00",
    "endTime": "16:00",
    "comment": "TEST: Deviation approval test"
  }' | jq -r '.id')

echo "Created deviation: $DEV_ID"

# Check initial status
INITIAL_STATUS=$(curl -s "$BASE_URL/deviations/$DEV_ID" | jq -r '.status')
echo "Initial status: $INITIAL_STATUS"

# Try to approve it
curl -s -X POST "$BASE_URL/manager/deviations/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "id": '$DEV_ID',
    "comment": "TEST: Approved deviation",
    "managerId": "'$TEST_MANAGER'"
  }' > /dev/null

# Check final status and manager comment
FINAL_STATUS=$(curl -s "$BASE_URL/deviations/$DEV_ID" | jq -r '.status')
DEV_MANAGER_COMMENT=$(curl -s "$BASE_URL/deviations/$DEV_ID" | jq -r '.managerComment // "NULL"')

echo "Final status: $FINAL_STATUS"
echo "Manager comment: $DEV_MANAGER_COMMENT"

if [ "$FINAL_STATUS" = "approved" ]; then
    print_success "Deviation status uppdaterades korrekt"
else
    print_error "Deviation status uppdaterades INTE"
fi

if [ "$DEV_MANAGER_COMMENT" = "NULL" ] || [ "$DEV_MANAGER_COMMENT" = "null" ]; then
    print_error "Deviation manager comment sparas INTE"
else
    print_success "Deviation manager comment sparas korrekt"
fi
echo ""

# Test 6: Employee Data Consistency
print_test "6. Employee Data Consistency Test"
echo "Kontrollerar employee data mapping..."

EMPLOYEE_DATA=$(curl -s "$BASE_URL/employees/$TEST_EMPLOYEE")
echo "Employee data structure:"
echo "$EMPLOYEE_DATA" | jq '{
    id: .id,
    employeeId: .employeeId,
    employee_id: .employee_id,
    firstName: .firstName,
    first_name: .first_name,
    lastName: .lastName,
    last_name: .last_name
}'
echo ""

# Summary
echo "🏁 TEST SUMMARY"
echo "==============="
echo "Granska alla resultat ovan för att identifiera kritiska problem"
echo "innan vi fortsätter med mock data rensning."
echo ""
print_warning "NÄSTA STEG: Fixa alla identifierade problem innan fortsatt rensning"