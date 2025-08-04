# 🗑️ MOCK DATA CLEANUP PLAN
**Systematisk rensning av mock data fallbacks**

## 🎯 MÅLSÄTTNING
- Säkra alla kritiska operationer (löner, löneexport, godkännanden)
- Behåll demo-funktionalitet för utveckling/presentation
- Skapa tydlig separation mellan DEV och PROD lägen

---

## 📊 NUVARANDE LÄGE
- **233 mock data referenser** totalt
- **15 API endpoints** med mock fallback
- **PAXML export redan säkrat** ✅

---

## 🔴 KRITISKA ENDPOINTS (Måste fixas omedelbart)

### Löne & Salary relaterat:
- `api/payslips/[employeeId].ts` - Lönespecar
- `api/time-balances/[employeeId].ts` - Tidssaldon (påverkar lön)

**Action:** Ta bort ALL mock fallback, kräv databas

### Godkännanden & Approvals:
- `api/manager/deviations/approve.ts`
- `api/manager/deviations/reject.ts` 
- `api/manager/leave-requests/approve.ts`
- `api/manager/leave-requests/reject.ts`

**Action:** Implementera `requireDatabase: true` för alla manager actions

---

## 🟡 VIKTIGA ENDPOINTS (Kontrollerad fallback)

### Användardata:
- `api/employee/current.ts` - Aktuell användare
- `api/deviations.ts` - Avvikelser (visa/skapa)
- `api/leave-requests.ts` - Ledighetsansökningar

**Action:** Miljöbaserad fallback (endast DEV läge)

### Manager översikter:
- `api/manager/deviations/pending.ts`
- `api/manager/leave-requests/pending.ts`

**Action:** Varning om mock data används + miljöflagga

---

## 🟢 DEMO-OK ENDPOINTS (Kan behålla fallback)

### Rapporter & Statistik:
- `api/schedules/[employeeId].ts` - Scheman
- `api/deviations/[id].ts` - Enskild avvikelse (readonly)
- `api/leave-requests/[id].ts` - Enskild ansökan (readonly)

**Action:** Tydlig markering som "DEMO DATA" i UI

---

## 🛠️ IMPLEMENTATION PLAN

### Fas 1: Miljökonfiguration
```typescript
// server/config.ts
export const CONFIG = {
  ALLOW_MOCK_FALLBACK: process.env.NODE_ENV === 'development',
  REQUIRE_DATABASE_FOR_CRITICAL: process.env.NODE_ENV === 'production',
  MOCK_DATA_WARNING: true
};
```

### Fas 2: Säkra kritiska endpoints
- Uppdatera alla 🔴 KRITISKA endpoints
- Implementera `requireDatabase: true`
- Ta bort mock fallback helt

### Fas 3: Kontrollerad fallback för viktiga
- Lägg till miljöcheckar
- Visa varningar i UI när mock data används
- Logga alla mock data användningar

### Fas 4: Demo-markering
- Lägg till "DEMO DATA" varning i UI
- Säkerställ att demo-data inte kan misstas för verklig data

---

## ⚡ QUICK WINS (Kan göras nu)

1. **Environment flag i storage:**
```typescript
private shouldAllowMockFallback(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true';
}
```

2. **Kritiska endpoints - omedelbar fix:**
```typescript
// I kritiska endpoints, lägg till:
if (process.env.NODE_ENV === 'production') {
  // Endast databas, ingen fallback
}
```

3. **UI varningar:**
```typescript
// Visa varning när mock data används
{usingMockData && (
  <Alert variant="warning">
    ⚠️ DEMO DATA - Inte verklig information
  </Alert>
)}
```

---

## 🎯 SUCCESS METRICS

- **0 mock references** i kritiska endpoints
- **Environment-based** fallback control
- **Tydliga varningar** när mock data används
- **Produktionssäker** lönehantering

---

## 📅 TIDSLINJE

**Vecka 1:** Fas 1-2 (Miljöconfig + kritiska endpoints)
**Vecka 2:** Fas 3 (Kontrollerad fallback)  
**Vecka 3:** Fas 4 (Demo-markering)
**Vecka 4:** Testning & validering

---

**Vill du att jag börjar med någon specifik del av denna plan?** 🚀