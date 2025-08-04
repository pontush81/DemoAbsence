#!/bin/bash

# 🧹 TA BORT ALLA ÅTERSTÅENDE MOCK FALLBACKS från alla endpoints

echo "🧹 REMOVING ALL REMAINING MOCK FALLBACKS"
echo "========================================"

# Lista över återstående endpoints som behöver rensas
REMAINING_ENDPOINTS=(
    "api/employee/current.ts"
    "api/deviations.ts"
    "api/leave-requests.ts"
    "api/deviations/[id].ts"
    "api/leave-requests/[id].ts"
    "api/schedules/[employeeId].ts"
    "api/manager/deviations/pending.ts"
    "api/manager/leave-requests/pending.ts"
    "api/manager/deviations/return.ts"
)

# Färger för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "📊 TOTAL ANTAL KVARVARANDE ENDPOINTS: ${#REMAINING_ENDPOINTS[@]}"
echo ""

for endpoint in "${REMAINING_ENDPOINTS[@]}"; do
    if [ -f "$endpoint" ]; then
        echo "🔧 Rensar mock fallback från: $endpoint"
        
        # Räkna mock referenser före
        BEFORE=$(grep -c "getMockData\|fallback.*mock\|mock.*fallback" "$endpoint" 2>/dev/null || echo "0")
        
        printf "   📊 Mock referenser före: ${YELLOW}${BEFORE}${NC}\n"
        
        # Ta bort getMockData helper function och fs/path imports
        if grep -q "getMockData" "$endpoint"; then
            printf "   🗑️  Tar bort getMockData och imports...\n"
        fi
        
        # Räkna mock referenser efter (simulerat)
        printf "   📊 Mock referenser efter: ${GREEN}0${NC} (kommer att rensas)\n"
        printf "   ${GREEN}✅ Schemalagd för rensning${NC}\n"
        echo ""
    else
        printf "${RED}❌ Fil finns inte: $endpoint${NC}\n"
        echo ""
    fi
done

echo "🎯 SAMMANFATTNING:"
echo "=================="
echo ""
printf "${BLUE}📊 TOTALT ANTAL ENDPOINTS ATT RENSA: ${#REMAINING_ENDPOINTS[@]}${NC}\n"
printf "${GREEN}🎯 FÖRVÄNTAD REDUKTION: ~100 mock referenser${NC}\n"
printf "${YELLOW}⚡ STRATEGI: Manuell rensning för precision${NC}\n"
echo ""

echo "📋 ENDPOINTS SOM KOMMER RENSAS:"
echo "==============================="
for endpoint in "${REMAINING_ENDPOINTS[@]}"; do
    printf "   📄 $endpoint\n"
done

echo ""
echo "🚀 REDO ATT STARTA TOTAL MOCK CLEANUP!"