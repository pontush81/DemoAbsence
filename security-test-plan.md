# 🚨 SÄKERHETSTEST: Rollhantering

## 🎯 SYFTE
Verifiera att endast HR-administratörer kan ändra användarroller och att vanliga medarbetare/chefer är blockerade från att eskalera sina behörigheter.

## 🧪 TESTFALL

### 1️⃣ TEST: Medarbetare (employee)
**Steg:**
1. Öppna http://localhost:3000/settings
2. Växla till "Medarbetare"-roll (om inte redan aktiv)
3. Klicka på "Roll"-tabben

**FÖRVÄNTAT RESULTAT:**
- ✅ Rollväljaren är INAKTIVERAD (grå bakgrund)
- ✅ Låsikon visas till höger
- ✅ Gul säkerhetsvarning: "Endast HR-administratörer kan ändra..."
- ✅ INGEN dropdown-meny visas
- ✅ Navigation-knappar visas INTE (eftersom användaren inte är chef/HR/payroll)

### 2️⃣ TEST: Chef (manager)
**Steg:**
1. Växla till HR-roll först
2. Ändra till "Chef"-roll
3. Klicka på "Roll"-tabben

**FÖRVÄNTAT RESULTAT:**
- ✅ Rollväljaren är INAKTIVERAD (grå bakgrund)
- ✅ Låsikon visas till höger
- ✅ Gul säkerhetsvarning: "Endast HR-administratörer kan ändra..."
- ✅ "Gå till Chefsområde"-knapp visas (eftersom de är chef)
- ✅ INGEN dropdown-meny för rollbyte

### 3️⃣ TEST: HR-administratör (hr)
**Steg:**
1. Växla till HR-roll
2. Klicka på "Roll"-tabben

**FÖRVÄNTAT RESULTAT:**
- ✅ Rollväljaren är AKTIV (vit bakgrund, fullt funktionell)
- ✅ Dropdown-meny med alla roller (Medarbetare, Chef, HR-specialist, Löneadministratör)
- ✅ Kan välja olika roller från dropdown
- ✅ "Gå till HR-område"-knapp visas
- ✅ INGEN säkerhetsvarning

### 4️⃣ TEST: Löneadministratör (payroll)
**Steg:**
1. Växla till HR-roll först
2. Ändra till "Löneadministratör"-roll
3. Klicka på "Roll"-tabben

**FÖRVÄNTAT RESULTAT:**
- ✅ Rollväljaren är INAKTIVERAD
- ✅ Låsikon och säkerhetsvarning visas
- ✅ "Gå till Löneområde"-knapp visas
- ✅ Kan INTE ändra roller

## 🔍 SÄKERHETSLOGGING
Öppna Developer Console (F12) och övervaka:

**Vid obehörig rollbyte-försök:**
```
🚨 SECURITY: Unauthorized role change attempt blocked
{
  currentUser: "E001",
  currentRole: "employee", 
  attemptedRole: "manager",
  timestamp: "2025-01-03T..."
}
```

**Vid behörig rollbyte (HR):**
```
✅ AUTHORIZED: Role change by HR administrator
{
  from: "hr",
  to: "manager", 
  user: "E001"
}
```

## ⚠️ SÄKERHETSBEKRÄFTELSER

### KRITISKA KONTROLLER:
- [ ] Medarbetare kan INTE göra sig till chef
- [ ] Chef kan INTE göra sig till HR eller payroll
- [ ] Payroll kan INTE ändra sin roll
- [ ] ENDAST HR kan ändra roller
- [ ] Alla rollbyte-försök loggas
- [ ] Säkerhetsvarningar visas korrekt

### BONUS SÄKERHETSTESTER:
- [ ] Testa att refresha sidan efter rollbyte
- [ ] Kontrollera att navigation-knappar endast visas för rätt roller
- [ ] Verifiera att låsikonen visas konsekvent

## 🎯 TESTRESULTAT
- **PASS**: Systemet blockerar obehöriga rollbyten
- **FAIL**: Användare kan eskalera sina behörigheter

## 📝 RAPPORTERA PROBLEM
Om något test MISSLYCKAS, rapportera:
1. Vilken roll du testade
2. Vad som hände vs. vad som skulle hända
3. Console-meddelanden
4. Screenshot av UI

---
**Säkerhetsansvarig:** HR-avdelningen
**Testdatum:** [DATUM]
**Status:** [PASS/FAIL]