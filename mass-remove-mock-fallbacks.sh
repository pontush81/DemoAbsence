#!/bin/bash

# 🧹 MASS REMOVAL OF ALL MOCK FALLBACKS
# Systematiskt tar bort alla mock data fallbacks från alla återstående endpoints

echo "🧹 MASS MOCK FALLBACK REMOVAL"
echo "============================="

# Lista över alla endpoints som behöver rensas
ENDPOINTS_TO_CLEAN=(
    "api/deviations.ts"
    "api/leave-requests.ts"
    "api/deviations/[id].ts"
    "api/leave-requests/[id].ts"
    "api/schedules/[employeeId].ts"
    "api/manager/deviations/pending.ts"
    "api/manager/leave-requests/pending.ts"
    "api/manager/deviations/return.ts"
)

# Färger
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_CLEANED=0
TOTAL_REFS_REMOVED=0

echo "🎯 ENDPOINTS ATT RENSA: ${#ENDPOINTS_TO_CLEAN[@]}"
echo ""

for endpoint in "${ENDPOINTS_TO_CLEAN[@]}"; do
    if [ -f "$endpoint" ]; then
        printf "${BLUE}🔧 Rensar: $endpoint${NC}\n"
        
        # Räkna mock referenser före
        BEFORE=$(grep -c "getMockData\|mock.*fallback\|fallback.*mock" "$endpoint" 2>/dev/null || echo "0")
        printf "   📊 Mock referenser före: ${YELLOW}${BEFORE}${NC}\n"
        
        if [ "$BEFORE" -gt 0 ]; then
            # Skapa backup
            cp "$endpoint" "${endpoint}.backup"
            
            # 1. Ta bort fs och path imports
            sed -i '' '/^import fs from/d' "$endpoint"
            sed -i '' '/^import path from/d' "$endpoint"
            
            # 2. Ta bort getMockData function
            sed -i '' '/Helper to read mock data/,/^}$/d' "$endpoint"
            sed -i '' '/async function getMockData/,/^}$/d' "$endpoint"
            
            # 3. Lägg till säkerhetskommentar
            sed -i '' '/Initialize Supabase client/a\
\
\/\/ 🚫 MOCK DATA REMOVED - All endpoints must use real database data only' "$endpoint"
            
            # 4. Ersätt Try Supabase first, fallback to mock data kommentarer
            sed -i '' 's/\/\/ Try Supabase first, fallback to mock data/\/\/ 🔒 DATABASE REQUIRED - No mock data fallback allowed/g' "$endpoint"
            
            # 5. Ta bort console.log med mock fallback
            sed -i '' '/console\.log.*[Ss]upabase.*failed.*mock/d' "$endpoint"
            sed -i '' '/console\.log.*[Ss]upabase.*not configured.*mock/d' "$endpoint"
            sed -i '' '/console\.log.*[Uu]sing mock data/d' "$endpoint"
            sed -i '' '/console\.log.*mock.*fallback/d' "$endpoint"
            
            # 6. Ta bort getMockData anrop
            sed -i '' '/= await getMockData/d' "$endpoint"
            sed -i '' '/await getMockData/d' "$endpoint"
            
            printf "   ${GREEN}✅ Rensad och backup skapad${NC}\n"
            TOTAL_CLEANED=$((TOTAL_CLEANED + 1))
            TOTAL_REFS_REMOVED=$((TOTAL_REFS_REMOVED + BEFORE))
        else
            printf "   ${GREEN}✅ Redan ren${NC}\n"
        fi
        echo ""
    else
        printf "${RED}❌ Fil finns inte: $endpoint${NC}\n"
        echo ""
    fi
done

echo "🎯 RESULTAT:"
echo "============"
printf "${GREEN}✅ Endpoints rensade: ${TOTAL_CLEANED}${NC}\n"  
printf "${GREEN}🗑️  Mock referenser borttagna: ${TOTAL_REFS_REMOVED}${NC}\n"
printf "${BLUE}📦 Backups skapade: ${TOTAL_CLEANED} filer${NC}\n"
echo ""

if [ $TOTAL_CLEANED -gt 0 ]; then
    printf "${YELLOW}⚠️  NÄSTA STEG:${NC}\n"
    echo "1. Manuellt fixa kvarvarande fallback logik i stora filer"
    echo "2. Testa endpoints för att säkerställa att de fungerar"
    echo "3. Ta bort backup filer när allt fungerar"
    echo ""
    printf "${GREEN}🚀 MASS CLEANUP GENOMFÖRD!${NC}\n"
else
    printf "${BLUE}ℹ️  Alla endpoints var redan rena${NC}\n"
fi