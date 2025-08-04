#!/bin/bash

# 📊 MOCK DATA ANALYSIS - Systematisk genomgång av alla mock data användningar

echo "📊 MOCK DATA USAGE ANALYSIS"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo "🔍 SCANNING CODEBASE FOR MOCK DATA USAGE..."
echo "==========================================="
echo ""

# Count total mock data references
TOTAL_MOCK_REFS=$(grep -r "getMockData\|mock.*fallback\|fallback.*JSON" --include="*.ts" --include="*.js" . | wc -l)
echo "📈 Total mock data references found: $TOTAL_MOCK_REFS"
echo ""

echo "📁 ANALYSIS BY COMPONENT:"
echo "========================"
echo ""

# 1. API Endpoints with mock data
printf "${BLUE}🌐 API ENDPOINTS with Mock Data Fallback:${NC}\n"
echo "----------------------------------------"
API_FILES=$(find api -name "*.ts" -exec grep -l "getMockData" {} \;)
for file in $API_FILES; do
    MOCK_COUNT=$(grep -c "getMockData" "$file")
    printf "   📄 ${file}: ${YELLOW}${MOCK_COUNT} mock references${NC}\n"
done
echo ""

# 2. Server storage layers
printf "${BLUE}🗄️  SERVER STORAGE LAYERS:${NC}\n"
echo "-------------------------"
STORAGE_FILES="server/storage.ts server/supabase-storage.ts server/supabase-rest-storage.ts"
for file in $STORAGE_FILES; do
    if [ -f "$file" ]; then
        MOCK_COUNT=$(grep -c "getMockData\|fallback" "$file")
        printf "   📄 ${file}: ${YELLOW}${MOCK_COUNT} mock/fallback references${NC}\n"
    fi
done
echo ""

# 3. Critical security analysis
printf "${RED}🔒 CRITICAL SECURITY ANALYSIS:${NC}\n"
echo "-----------------------------"

# Check for PAXML export security
if grep -q "getDeviationsForExport\|getEmployeesForExport" server/supabase-rest-storage.ts; then
    printf "   ✅ PAXML export uses secure methods\n"
else
    printf "   ❌ PAXML export security methods missing\n"
fi

# Check for mock data in critical operations
CRITICAL_OPERATIONS=(
    "paxml/export"
    "payroll"
    "salary"
    "wage"
)

for op in "${CRITICAL_OPERATIONS[@]}"; do
    if grep -r "$op" --include="*.ts" . | grep -q "getMockData\|fallback"; then
        printf "   🚨 ${RED}CRITICAL${NC}: Mock data found in $op operations\n"
    fi
done
echo ""

# 4. Development vs Production usage
printf "${PURPLE}🔧 DEVELOPMENT vs PRODUCTION USAGE:${NC}\n"
echo "-----------------------------------"

# Check for environment-based logic
ENV_BASED=$(grep -r "NODE_ENV\|process\.env\|development\|production" --include="*.ts" . | grep -i mock | wc -l)
printf "   📊 Environment-based mock logic: ${ENV_BASED} references\n"

# Check for demo-specific mock data
DEMO_REFS=$(grep -r "demo\|Demo\|DEMO" --include="*.ts" . | grep -i mock | wc -l)
printf "   🎬 Demo-specific mock references: ${DEMO_REFS} references\n"
echo ""

# 5. Mock data files analysis
printf "${GREEN}📂 MOCK DATA FILES:${NC}\n"
echo "------------------"
if [ -d "mock-data" ]; then
    MOCK_FILES=$(find mock-data -name "*.json" | wc -l)
    MOCK_SIZE=$(du -sh mock-data | cut -f1)
    printf "   📁 Mock data files: ${MOCK_FILES} files (${MOCK_SIZE})\n"
    
    echo "   📋 Mock data files:"
    for file in mock-data/*.json; do
        if [ -f "$file" ]; then
            SIZE=$(ls -lh "$file" | awk '{print $5}')
            LINES=$(wc -l < "$file")
            printf "      📄 $(basename "$file"): ${SIZE} (${LINES} lines)\n"
        fi
    done
else
    printf "   ❌ Mock data directory not found\n"
fi
echo ""

# 6. Recommendations
printf "${YELLOW}💡 RECOMMENDATIONS:${NC}\n"
echo "==================="
echo ""

printf "${GREEN}🎯 IMMEDIATE ACTIONS NEEDED:${NC}\n"
echo "----------------------------"
echo "1. 🔒 Secure all salary/payroll related endpoints"
echo "2. 🗑️  Remove mock data fallback from production-critical operations"
echo "3. 🔄 Convert development-only endpoints to use environment flags"
echo "4. 📝 Document which endpoints MUST have database vs can have fallback"
echo ""

printf "${BLUE}📋 CATEGORIZATION NEEDED:${NC}\n"
echo "------------------------"
echo "• 🔴 CRITICAL (No mock allowed): Payroll, PAXML export, salary calculations"
echo "• 🟡 IMPORTANT (Controlled fallback): User data, time tracking, approvals"
echo "• 🟢 DEMO-OK (Can have fallback): Reports, statistics, non-critical data"
echo ""

printf "${PURPLE}🛠️  REFACTORING STRATEGY:${NC}\n"
echo "------------------------"
echo "1. Create environment-based configuration"
echo "2. Implement production vs development modes"
echo "3. Add explicit database-required flags for critical operations"
echo "4. Keep minimal mock data for development/testing only"
echo ""

echo "🎯 NEXT STEPS:"
echo "============="
echo "1. Run: ./create-mock-cleanup-plan.sh"
echo "2. Review critical vs non-critical endpoints"
echo "3. Implement environment-based mock data control"
echo "4. Test all endpoints with database-only mode"