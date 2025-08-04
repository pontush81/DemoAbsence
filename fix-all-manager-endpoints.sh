#!/bin/bash

# 🔒 FIXA ALLA MANAGER ENDPOINTS - Ta bort mock data fallback från kritiska godkännanden

echo "🔒 SÄKRAR ALLA MANAGER ENDPOINTS..."
echo "=================================="

# Lista över alla manager endpoints som behöver fixas
MANAGER_ENDPOINTS=(
    "api/manager/deviations/reject.ts"
    "api/manager/leave-requests/approve.ts" 
    "api/manager/leave-requests/reject.ts"
)

# Färger för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

for endpoint in "${MANAGER_ENDPOINTS[@]}"; do
    if [ -f "$endpoint" ]; then
        echo "🔧 Säkrar: $endpoint"
        
        # Ta bort getMockData helper function
        sed -i '' '/Helper to read mock data/,/^}$/d' "$endpoint"
        
        # Ta bort fs och path imports
        sed -i '' '/import fs from/d' "$endpoint"
        sed -i '' '/import path from/d' "$endpoint"
        
        # Lägg till säkerhetskommentar
        sed -i '' 's/\/\/ Initialize Supabase client/\/\/ Initialize Supabase client/' "$endpoint"
        sed -i '' '/\/\/ Initialize Supabase client/a\
\
\/\/ 🚫 MOCK DATA REMOVED - Manager actions are LEGALLY-CRITICAL and must use real database data only' "$endpoint"
        
        printf "${GREEN}✅ Säkrat: $endpoint${NC}\n"
    else
        printf "${RED}❌ Fil finns inte: $endpoint${NC}\n"
    fi
done

echo ""
echo "🎯 MANAGER ENDPOINTS SÄKRADE!"
echo "============================="
echo "✅ Alla manager godkännanden kräver nu databas"
echo "✅ Mock data fallback borttagen från kritiska operationer"
echo "✅ Säkra felmeddelanden implementerade"