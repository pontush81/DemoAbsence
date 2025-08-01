# Kontek Lön - Tidrapporteringssystem (Demo)

Ett fullstack tidrapporteringssystem som fungerar som **försystem** till Kontek Lön. Systemet låter anställda registrera arbetstid, avvikelser och ledighetsansökningar som sedan exporteras som PAXML-filer för import i Kontek Lön.

## 🎯 Vad är detta?

Detta är ett **demo-system** som visar hur ett modernt tidrapporteringssystem kan integreras med Kontek Lön via PAXML-formatet. Systemet simulerar en komplett HR-workflow:

- **Anställda** registrerar arbetstid och avvikelser
- **Chefer** godkänner eller avvisar ansökningar  
- **Systemet** exporterar PAXML-filer för lönebearbetning
- **Kontek Lön** importerar PAXML för lönekörning

## 🏗️ Arkitektur

```
Frontend (React + TypeScript) ↔ Backend (Express + TypeScript) ↔ Databas (Supabase/JSON)
                                         ↓
                                   PAXML Export
                                         ↓
                                   Kontek Lön
```

### Teknisk Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Databas**: Supabase PostgreSQL (fallback till JSON-filer för demo)
- **Integration**: PAXML 2.2 format för Kontek Lön

## 🚀 Snabbstart

### 1. Krav
- Node.js v18+ 
- npm eller yarn

### 2. Installation
```bash
# Klona/navigera till projektet
cd sourcecode_avvikelse

# Installera dependencies
npm install
```

### 3. Miljövariabler
Skapa en `.env` fil i projektets rot:

```env
NODE_ENV=development

# Supabase Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Optional (för framtida auth funktionalitet)
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_JWT_SECRET=[YOUR-JWT-SECRET]

# Server Configuration  
PORT=3000
```

### 4. Starta systemet
```bash
# Starta utvecklingsservern
npm run dev

# Eller explicit på port 3000
PORT=3000 npm run dev
```

**Servern startar på:** `http://localhost:3000`

## 📱 Demo-funktionalitet

### Tillgängliga sidor
| URL | Beskrivning |
|-----|-------------|
| `/` | Dashboard med översikt |
| `/deviations` | Registrera arbetstidsavvikelser |
| `/leave` | Ansök om ledighet |
| `/manager` | Chefvy för godkännanden |
| `/paxml-export` | Exportera PAXML för Kontek Lön |
| `/settings` | Personliga inställningar |

### Test-användare
| Användar-ID | Namn | Roll | Syfte |
|-------------|------|------|-------|
| E001 | Anna Andersson | Anställd | Huvudanvändare för demo |
| E002 | Erik Johansson | Anställd | Demo-scheman 09:00-18:00 |
| E003 | Maria Nilsson | Anställd | Demo-scheman 08:30-17:30 |
| E004 | Lars Petersson | Anställd | Demo-scheman 07:00-16:00 (tidig start) |
| E005 | Mikael Svensson | Chef | Godkännanden och manager-vy |

### 🗓️ Demo-scheman (Maj 2025)
Systemet innehåller kompletta arbetstidsscheman för demonstration:

- **Tidsperiod:** 1-9 maj 2025 (vardagar)
- **Realistiska arbetstider:** Olika scheman per medarbetare
- **Raster inkluderade:** Automatisk beräkning av netto arbetstid
- **PAXML-export:** Exporteras som `<schematransaktioner>` enligt standard

## 🔧 API Endpoints

### Grundläggande
```http
GET  /api/test                 # Test att API fungerar
GET  /api/test-data           # Test av datalagring
```

### Medarbetare
```http
GET  /api/employees           # Alla medarbetare
GET  /api/employee/current    # Nuvarande inloggad användare
GET  /api/employees/:id       # Specifik medarbetare
PATCH /api/employees/:id      # Uppdatera medarbetare
```

### Avvikelser
```http
GET  /api/deviations                    # Alla avvikelser (med filter)
GET  /api/deviations/:id               # Specifik avvikelse
POST /api/deviations                   # Skapa ny avvikelse
PATCH /api/deviations/:id              # Uppdatera avvikelse
DELETE /api/deviations/:id             # Ta bort avvikelse

# Manager endpoints
GET  /api/manager/deviations/pending   # Avvikelser att godkänna
POST /api/manager/deviations/:id/approve
POST /api/manager/deviations/:id/reject
POST /api/manager/deviations/:id/return
```

### Ledighetsansökningar
```http
GET  /api/leave-requests               # Alla ledighetsansökningar
POST /api/leave-requests               # Skapa ny ansökan
PATCH /api/leave-requests/:id          # Uppdatera ansökan
DELETE /api/leave-requests/:id         # Ta bort ansökan

# Manager endpoints  
GET  /api/manager/leave-requests/pending
POST /api/manager/leave-requests/:id/approve
POST /api/manager/leave-requests/:id/reject
```

### PAXML Export
```http
POST /api/paxml/export                 # Exportera avvikelser som PAXML
POST /api/paxml/export-with-schedules  # Exportera med scheman
POST /api/paxml/import-schedules       # Importera scheman från PAXML
```

### Övriga
```http
GET /api/timecodes                     # Alla tidkoder (SJK, VAB, etc.)
GET /api/schedules                     # Arbetstidsscheman
GET /api/time-balances/:employeeId     # Tidssaldon för medarbetare
GET /api/payslips/:employeeId          # Lönespecifikationer
```

## 📊 Demo-data

Systemet kommer förladdat med:
- **5 medarbetare** från olika avdelningar
- **Tidkoder** för avvikelser (övertid, sjukdom, VAB, etc.)
- **Exempel-avvikelser** i olika statusar
- **Ledighetsansökningar** 
- **Arbetstidsscheman**
- **Lönespecifikationer**

## 🔄 PAXML Integration

### Vad är PAXML?
PAXML (Payroll and time reporting XML) är en svensk branschstandard för överföring av tid- och löneunderlag mellan system.

### Export-process
1. **Anställda** registrerar avvikelser i systemet
2. **Chef** godkänner avvikelserna
3. **HR/Löneadmin** exporterar PAXML-fil via `/paxml-export`
4. **PAXML-filen** importeras i Kontek Lön
5. **Kontek Lön** bearbetar enligt kollektivavtal och löneregler

### Exempel PAXML Export
```bash
# Exportera endast avvikelser
curl -X POST http://localhost:3000/api/paxml/export \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-05-01",
    "endDate": "2025-05-09", 
    "employeeIds": ["E001", "E002"]
  }'

# Exportera med både avvikelser och scheman (demo-period)
curl -X POST http://localhost:3000/api/paxml/export-with-schedules \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-05-01",
    "endDate": "2025-05-09",
    "employeeIds": ["E001", "E002"],
    "includeSchedules": true
  }'
```

**PAXML-utdata innehåller:**
- `<tidtransaktioner>` - Godkända avvikelser (SEM, SJK, VAB, etc.)
- `<schematransaktioner>` - Arbetstidsscheman med netto arbetstid
- Korrekt formatering enligt PAXML 2.2 standard
- Kompatibel med Kontek Lön import

## 🗂️ Projektstruktur

```
sourcecode_avvikelse/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI komponenter
│   │   ├── pages/         # Sidor/vyer
│   │   ├── lib/           # Utilities och API-client
│   │   └── main.tsx       # App entry point
├── server/                # Express backend  
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Datalagring (JSON/Supabase)
│   ├── lib/paxml.ts       # PAXML export/import
│   └── index.ts           # Server entry point
├── shared/                # Delad TypeScript types
│   └── schema.ts          # Databas schema och types
├── mock-data/             # Demo-data (JSON filer)
├── uploads/               # Genererade filer (PAXML exports)
└── tests/                 # E2E tester (Playwright)
```

## 🧪 Testning

```bash
# Kör E2E tester
npm test

# Kör tester med UI
npm run test:ui

# Visa test-rapport
npm run test:report
```

## 🔧 Utveckling

### Starta utvecklingsmiljö
```bash
# Terminal 1: Starta backend + frontend
npm run dev

# Servern körs på http://localhost:3000
# Frontend accessible via samma port (Vite proxy)
```

### Databas (Supabase)
```bash
# Push schema ändringar till Supabase
npm run db:push

# För demo: Systemet fallback till JSON-filer automatiskt
```

## 🚧 Kända begränsningar (Demo)

- **Autentisering**: Simulerad - alla är inloggade som Anna (E001)
- **Datalagring**: JSON-filer (inte permanent mellan omstarter)
- **Filuppladdningar**: Lokalt i `uploads/` mappen
- **E-postnotifikationer**: Mockade/loggade endast
- **Rättigheter**: Grundläggande rollbasering

## 📋 Vanliga kommandon

```bash
# Starta servern på specifik port
npm run dev

# Döda processer som blockerar port (om behövs)
lsof -ti:3000 | xargs kill -9

# Kontrollera att servern fungerar
curl http://localhost:3000/api/test

# Se alla medarbetare
curl http://localhost:3000/api/employees

# Exportera PAXML (alla godkända avvikelser)
curl -X POST http://localhost:3000/api/paxml/export \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🎯 Nästa steg för Production

1. **Autentisering**: Implementera riktig user auth (JWT/OAuth)
2. **Databas**: Aktivera Supabase eller annan produktionsdatabas  
3. **Fillagring**: Cloud storage för PAXML-filer och dokument
4. **Notifikationer**: E-post/SMS för godkännanden
5. **Audit log**: Fullständig granskningslogg
6. **Performance**: Cachning och optimering
7. **Security**: Rate limiting, input validation, HTTPS

## 📞 Support

För demo-ändamål, kontakta utvecklingsteamet för frågor om:
- PAXML-formatering
- Kontek Lön integration  
- Systemarkitektur
- Utbyggnad för production

---

**🎉 Systemet är nu redo för demo!** 

Starta med `npm run dev` och navigera till `http://localhost:3000`