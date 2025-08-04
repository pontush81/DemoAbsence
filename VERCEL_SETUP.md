# Vercel Environment Variables Setup

## ⚠️ Viktigt: Ta bort mock data och använd riktig databas

Projektet ska använda Supabase-databasen, INTE mock data!

## 📋 Konfigurera Environment Variables i Vercel:

1. **Gå till ditt Vercel-projekt**: https://vercel.com/dashboard
2. **Project Settings** → **Environment Variables**
3. **Lägg till dessa variabler:**

```
SUPABASE_URL = https://glqywwuchtpzehhuwbro.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscXl3d3VjaHRwemVoaHV3YnJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzkxMjQsImV4cCI6MjA2OTU1NTEyNH0.XseH2QeuVShm-CEQdtvND1Yjp1IecA8Sg-dsqQMf1Qs
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscXl3d3VjaHRwemVoaHV3YnJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3OTEyNCwiZXhwIjoyMDY5NTU1MTI0fQ.0y9SH4wLYEUFC-uvEllQ0ct4PLS9v7XZSjKJNwMtqt_w
```

4. **Environment**: Välj "Production", "Preview", och "Development"
5. **Save**
6. **Redeploy** projektet

## 🎯 Resultat:
- ✅ API:er använder riktig Supabase-databas  
- ❌ Ingen mock data (som det ska vara!)
- ✅ Riktiga användare, avvikelser, ledighetsansökningar etc.

## 🔧 Efter setup:
Alla 500-fel borde försvinna och API:erna ska fungera med riktig data från Supabase.