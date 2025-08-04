# 🔍 SERVER ROUTES MOCK DATA AUDIT

## 📊 IDENTIFIERADE MOCK REFERENSER (18 stycken)

### 🔴 KRITISKA (Måste fixas - påverkar löner/godkännanden)
- **Line 1312** - Deviation updates i approval workflow
- **Line 1368** - Deviation updates i approval workflow  
- **Line 1422** - Deviation updates i approval workflow
- **Line 1542** - Leave request updates i approval workflow
- **Line 1659** - PAXML export mock fallback (redan delvis fixad men kanske kvar?)
- **Line 1905** - PAXML export with schedules mock fallback

### 🟡 VIKTIGA (Bör fixas - affärslogik)
- **Line 86** - Time balance updates (påverkar löner indirekt)
- **Line 156** - Time balance updates
- **Line 1168** - Time balance updates
- **Line 754** - Time codes (påverkar approval logic)
- **Line 1696** - Employee data för PAXML
- **Line 1936** - Employee data för PAXML

### 🟢 DEMO/DEV (Kan behållas för utveckling)
- **Line 21** - Schedule import (utvecklings-feature)
- **Line 49** - Dashboard statistics (demo data)
- **Line 101** - Dashboard statistics (demo data)  
- **Line 785** - Deviation creation fallback
- **Line 1076** - Leave request creation fallback
- **Line 1787** - Schedule operations

## 🎯 PRIORITERING

1. **PAXML export** - Redan fixad? Kontrollera!
2. **Manager approval workflows** - KRITISKT
3. **Time balance updates** - Påverkar löner
4. **Employee/time codes** - Basdata
5. **Creation fallbacks** - Mindre kritiskt
6. **Demo/statistics** - Låg prioritet

## 🚀 ÅTGÄRDSPLAN

**Fas 1:** Säkra PAXML och approval workflows (kritiska)
**Fas 2:** Fixa time balances och basdata (viktiga)  
**Fas 3:** Besluta om creation fallbacks (beroende på användarfall)
**Fas 4:** Lämna demo/statistics (behålls för utveckling)