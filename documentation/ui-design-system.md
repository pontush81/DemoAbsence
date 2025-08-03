# 🎨 UI Design System - Avvikelsekort

## 📐 DESIGNPRINCIPER

### **Enhetlighet (Consistency)**
Alla avvikelsekort ska följa samma visuella mönster för att skapa en sammanhängande användarupplevelse.

## 🎯 KORTSTILAR

### **📱 STORA AVVIKELSEKORT** (Standard)
**Används i:** Deviation Type Selector, Quick Actions

**Tekniska specifikationer:**
```css
min-h-[80px] sm:min-h-[100px]
py-6 sm:py-8
text-sm sm:text-base
font-semibold
shadow-md hover:shadow-lg
transition-all duration-200
```

**Grid Layout:**
```css
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
gap-3 sm:gap-4
```

### **🎨 FÄRGSYSTEM**

#### **Sjuk/VAB (Medicinskt)**
- **Bakgrund:** `bg-blue-600 hover:bg-blue-700`
- **Text:** `text-white`
- **Ikon:** `🏥` (Sjukhus - neutral medicinsk symbol)
- **Variant:** `default` (solid bakgrund)

#### **Övertid (Arbetstid)**
- **Bakgrund:** `bg-white hover:bg-indigo-100`
- **Border:** `border-2 border-indigo-300 hover:border-indigo-400`
- **Text:** `text-indigo-700`
- **Ikon:** `⏰` (Klocka - tid-relaterad)
- **Variant:** `outline`

#### **Ledighet (Semester/Ledighet)**
- **Bakgrund:** `bg-white hover:bg-green-100`
- **Border:** `border-2 border-green-300 hover:border-green-400`
- **Text:** `text-green-700`
- **Ikon:** `🌴` (Palm - semester/vila)
- **Variant:** `outline`

#### **Andra typer**
- **Bakgrund:** `bg-white hover:bg-gray-100`
- **Border:** `border-2 border-gray-300 hover:border-gray-400`
- **Text:** `text-gray-700`
- **Ikon:** Originell från action
- **Variant:** `outline`

## 🏗️ KOMPONENTSTRUKTUR

### **Kortlayout**
```jsx
<Button>
  <div className="flex flex-col items-center justify-center space-y-2">
    <div className="text-xl sm:text-2xl">
      {/* Ikon */}
    </div>
    <div className="text-center">
      <div className="font-bold text-sm sm:text-base leading-tight">
        {/* Label */}
      </div>
    </div>
  </div>
</Button>
```

## 🎯 IKONSYSTEM

### **Konsekventa ikoner**
- **Sjukdom (300):** `🏥` - Neutral medicinsk symbol
- **VAB (400):** `🏥` - Samma som sjukdom för enhetlighet
- **Övertid (200):** `⏰` - Tidsrelaterad
- **Ledighet:** `🌴` - Semester/vila
- **Fallback:** Använd originalikon från action

### **Ikon riktlinjer**
- Storlek: `text-xl sm:text-2xl`
- Neutral representation (undvika överdrivet dramatiska ikoner)
- Konsistenta inom kategorier

## 📋 IMPLEMENTATION

### **Quick Actions (deviation-form.tsx)**
```jsx
const isSickOrVAB = action.timeCode === '300' || action.timeCode === '400';
const isOvertime = action.timeCode === '200';

<Button
  variant={isSickOrVAB ? "default" : "outline"}
  className={/* Färgsystem enligt ovan */}
>
  {/* Kortstruktur enligt ovan */}
</Button>
```

### **Deviation Type Selector (deviation-type-selector.tsx)**
```jsx
{/* Sjuk/VAB */}
<Button className="bg-blue-600 hover:bg-blue-700 text-white">

{/* Övertid */} 
<Button variant="outline" className="border-indigo-300 text-indigo-700">

{/* Ledighet */}
<Button variant="outline" className="border-green-300 text-green-700">
```

## ✅ FÖRDELAR MED DETTA SYSTEM

1. **🎯 Visuell Hierarki:** Sjuk/VAB är mest critical → solid bakgrund
2. **🌈 Färgpsykologi:** Blå = lugn/medicinsk, Indigo = arbete, Grön = vila
3. **📱 Responsiv:** Fungerar på alla skärmstorlekar
4. **♿ Accessibility:** Tydliga kontraster och stor klickyta
5. **🔄 Skalbarhet:** Enkelt att lägga till nya avvikelsetyper

## 🔧 UNDERHÅLL

När nya avvikelsetyper läggs till:
1. Definiera färgsystem enligt kategorier ovan
2. Välj passande neutral ikon
3. Använd samma komponentstruktur
4. Testa på olika skärmstorlekar

---
**Uppdaterad:** 2025-01-03  
**Status:** ✅ Implementerat i Quick Actions och Deviation Type Selector