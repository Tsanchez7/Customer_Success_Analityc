# 🤖 Customer Success Analytics - Documentación Completa

## 📋 Índice
1. [🚀 Inicio Rápido](#-inicio-rápido)
2. [📦 Estructura del Proyecto](#-estructura-del-proyecto)
3. [🎯 Visión General](#-visión-general)
4. [🏗️ Arquitectura del Sistema](#-arquitectura-del-sistema)
5. [🤖 Agentes de Análisis](#-agentes-de-análisis)
6. [🔄 Flujo de Datos](#-flujo-de-datos)
7. [🧮 Algoritmos de Cálculo](#-algoritmos-de-cálculo)
8. [🔌 Extensibilidad](#-extensibilidad)

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Edge)
- Archivo Excel con datos de clientes (.xlsx)
- **NO requiere instalación** ni dependencias

### Opción 1: Lanzar desde el Sistema Principal

1. **Abrir la página de inicio:**
   ```bash
   # Windows
   Start-Process "inicio.html"
   
   # O simplemente haz doble clic en:
   inicio.html
   ```

2. **Desde ahí podrás:**
   - Ver la presentación del sistema
   - Hacer clic en "Start Analysis" para entrar al dashboard
   - Acceder a generadores de datos de prueba

### Opción 2: Acceso Directo a Páginas Específicas

**Para análisis histórico (10 años):**
```bash
Start-Process "1_historial.html"
```

**Para estado actual (2026):**
```bash
Start-Process "2_actualidad.html"
```

**Para proyecciones futuras:**
```bash
Start-Process "3_tendencias.html"
```

### Paso a Paso Completo

1. **Generar Datos de Prueba** (si no tienes un archivo Excel):
   ```bash
   Start-Process "generar_datos_10años.html"
   ```
   - Esto abrirá un generador automático
   - Haz clic en "🚀 Generar Excel con 10 Años de Datos"
   - Se descargará `datos_historicos_10años.xlsx`

2. **Abrir cualquier página del dashboard**:
   - Opción A: `inicio.html` → "Start Analysis"
   - Opción B: Directamente `1_historial.html`, `2_actualidad.html` o `3_tendencias.html`

3. **Cargar tu archivo Excel**:
   - Haz clic en el botón **"📂 Cargar Excel"** (esquina superior derecha)
   - Selecciona tu archivo `.xlsx`
   - Espera 2-3 segundos mientras procesa
   - ✅ Verás: "Datos cargados correctamente y sincronizados"

4. **Navegar entre páginas**:
   - Usa el menú de navegación superior
   - Los datos se comparten automáticamente entre todas las páginas
   - No necesitas volver a cargar el Excel en cada página

### Solución de Problemas

**No ves los cambios / La página no carga datos:**
```bash
# Limpiar caché del navegador
# Presiona: Ctrl + Shift + R (forzar recarga)
```

**LocalStorage lleno o corrupto:**
```javascript
// Abrir consola de desarrollador (F12) y ejecutar:
localStorage.clear()
// Luego recarga la página (F5)
```

**Los gráficos no aparecen:**
- Verifica tu conexión a internet (usa CDN de Chart.js)
- O descarga Chart.js localmente

---

## 📦 Estructura del Proyecto

```
📁 APP Gestion y análisis comportamiento cliente/
│
├── 🌐 PÁGINAS PRINCIPALES
│   ├── inicio.html                    ← Página de bienvenida
│   ├── 1_historial.html              ← Análisis histórico 10 años
│   ├── 2_actualidad.html             ← Estado actual 2026
│   ├── 3_tendencias.html             ← Proyecciones 2027
│   └── index.html                     ← Dashboard original (legacy)
│
├── 📜 SCRIPTS JAVASCRIPT
│   ├── script_historial.js           ← Lógica página Historial
│   ├── script_actualidad.js          ← Lógica página Actualidad
│   ├── script_tendencias.js          ← Lógica página Tendencias
│   ├── help-system.js                ← Sistema de ayuda y tooltips
│   └── script.js                      ← Script original (legacy)
│
├── 🎨 ESTILOS CSS
│   ├── style.css                      ← Estilos globales
│   ├── navigation.css                 ← Barra de navegación y sidebar
│   └── help-system.css                ← Estilos de tooltips y ayuda
│
├── 🔧 GENERADORES DE DATOS
│   ├── generar_datos_10años.html     ← Genera Excel 2016-2026
│   ├── generar_datos_5años.html      ← Genera Excel 2021-2026
│   ├── generar_excel_offline.html    ← Plantilla offline
│   ├── generar_datos.html            ← Generador básico
│   ├── generar_excel.py              ← Script Python (opcional)
│   └── generar_excel.ps1             ← Script PowerShell (opcional)
│
├── 📊 DATOS CSV (ejemplos)
│   ├── Accounts.csv
│   ├── Period_Data.csv
│   └── NPS_Data.csv
│
├── 📖 DOCUMENTACIÓN
│   ├── agents.md                      ← Este archivo
│   ├── GUIA_SISTEMA_MULTIPAGINA.md   ← Guía del sistema multi-página
│   ├── README_GUIA.md                ← README principal
│   ├── PRD.md                         ← Product Requirements Document
│   ├── PRD_Customer_Success_Predictive_Analytics.md
│   ├── COMO_USAR.txt                 ← Instrucciones de uso
│   ├── COMO_GENERAR_EXCEL.md         ← Cómo generar archivos Excel
│   ├── ESTRUCTURA.txt                ← Estructura del proyecto
│   ├── VALIDACION.txt                ← Validación de datos
│   ├── INSTRUCCIONES.txt             ← Instrucciones generales
│   ├── 📌_EMPIEZA_AQUI.txt           ← Punto de inicio
│   ├── 🚀_GUIA_RAPIDA.txt            ← Guía rápida
│   ├── 📊_GUIA_DATOS_HISTORICOS.md   ← Guía de datos históricos
│   ├── 📊_REVENUE_AT_RISK.md         ← Documentación Revenue at Risk
│   └── ✅_PROYECTO_COMPLETADO.txt    ← Estado del proyecto
│
└── 🧪 UTILIDADES
    ├── test_diagnostico.html          ← Tests de diagnóstico
    ├── test_sistema.html              ← Tests del sistema
    ├── csv_a_excel.html               ← Convertidor CSV a Excel
    ├── descargar_excel.html           ← Descargador de Excel
    └── guardar-foto.html              ← Guardar capturas
```

### Páginas por Función

| Página | Función | Cuándo Usar |
|--------|---------|-------------|
| `inicio.html` | Landing page con presentación | Primera vez / Acceso general |
| `1_historial.html` | Análisis 10 años (2016-2026) | Revisiones trimestrales/anuales |
| `2_actualidad.html` | Estado actual 2026 | Revisiones semanales/mensuales |
| `3_tendencias.html` | Proyecciones 2027 | Planificación estratégica |
| `index.html` | Dashboard original | Análisis específico |

---

## 🎯 Visión General

El Dashboard de Gestión de Cuentas implementa un sistema modular de "agentes" especializados que procesan datos de clientes para generar insights accionables. Cada agente es responsable de un aspecto específico del análisis.

### Principios de Diseño
- **Modularidad**: Cada agente opera independientemente
- **Composabilidad**: Los agentes pueden combinarse para análisis complejos
- **Escalabilidad**: Nuevos agentes pueden agregarse sin modificar el core
- **Observabilidad**: Logging detallado en cada paso del procesamiento

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
│                        (index.html)                          │
│                  - UI/UX del Dashboard                       │
│                  - Visualización de KPIs                     │
│                  - Tablas de análisis                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  CAPA DE ORQUESTACIÓN                        │
│                       (script.js)                            │
│                  - Coordinador Principal                     │
│                  - Gestión de estado                         │
│                  - Enrutamiento de datos                     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   AGENTES DE ANÁLISIS                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   MRR    │  │   NRR    │  │  Churn   │  │   NPS    │   │
│  │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Health  │  │ Adoption │  │ Revenue  │  │ Renewal  │   │
│  │  Score   │  │   Rate   │  │ at Risk  │  │   Rate   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                             │
│                  - Parser Excel (SheetJS)                    │
│                  - Validación de datos                       │
│                  - Normalización                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 Agentes de Análisis

### 1. **MRR Agent (Monthly Recurring Revenue)**
**Responsabilidad**: Calcular ingresos recurrentes mensuales totales

**Entrada**:
```javascript
excelData.accounts = [
  { Account_ID, Account_Name, MRR_Current, ... }
]
```

**Algoritmo**:
```javascript
MRR = Σ (MRR_Current de todas las cuentas activas)
```

**Salida**:
```javascript
{ mrr: 27000 } // en dólares
```

**Código**: `calculateMRR()` en script.js

---

### 2. **ARR Agent (Annual Recurring Revenue)**
**Responsabilidad**: Proyectar ingresos anuales recurrentes

**Entrada**:
- MRR calculado por MRR Agent

**Algoritmo**:
```javascript
ARR = MRR × 12
```

**Salida**:
```javascript
{ arr: 324000 } // en dólares
```

**Código**: `calculateARR(mrr)` en script.js

---

### 3. **NRR Agent (Net Revenue Retention)**
**Responsabilidad**: Medir retención de ingresos considerando expansión y contracción

**Entrada**:
```javascript
excelData.periodData = [
  {
    Account_ID,
    Period,
    MRR_Starting,
    Expansion_Revenue,
    Contraction_Revenue,
    Churned_Revenue
  }
]
```

**Algoritmo**:
```javascript
Starting_Revenue = Σ MRR_Starting (período más reciente)
Expansion = Σ Expansion_Revenue
Contraction = Σ Contraction_Revenue
Churn = Σ Churned_Revenue

NRR = ((Starting_Revenue + Expansion - Contraction - Churn) / Starting_Revenue) × 100
```

**Interpretación**:
- NRR > 100%: Crecimiento orgánico (expansión supera pérdidas)
- NRR = 100%: Retención perfecta sin crecimiento
- NRR < 100%: Pérdida neta de ingresos

**Salida**:
```javascript
{ nrr: 105.5 } // en porcentaje
```

**Código**: `calculateNRR()` en script.js

---

### 4. **Churn Rate Agent**
**Responsabilidad**: Calcular tasa de abandono de clientes

**Entrada**:
```javascript
excelData.periodData = [
  {
    Account_ID,
    Period,
    Clients_Start_Period,
    Clients_Churned
  }
]
```

**Algoritmo**:
```javascript
Total_Clients_Start = Σ Clients_Start_Period (último período)
Total_Clients_Churned = Σ Clients_Churned (último período)

Churn_Rate = (Total_Clients_Churned / Total_Clients_Start) × 100
```

**Benchmarks**:
- < 5%: Excelente
- 5-10%: Bueno
- 10-15%: Preocupante
- > 15%: Crítico

**Salida**:
```javascript
{ churn: 7.8 } // en porcentaje
```

**Código**: `calculateChurnRate()` en script.js

---

### 5. **NPS Agent (Net Promoter Score)**
**Responsabilidad**: Medir satisfacción y lealtad del cliente

**Entrada**:
```javascript
excelData.npsData = [
  { Account_ID, Period, NPS_Response } // 0-10
]
```

**Algoritmo**:
```javascript
// Clasificación de respuestas
Promoters = respuestas con valor 9-10
Passives = respuestas con valor 7-8
Detractors = respuestas con valor 0-6

% Promoters = (Promoters / Total_Responses) × 100
% Detractors = (Detractors / Total_Responses) × 100

NPS = % Promoters - % Detractors
```

**Interpretación**:
- NPS > 50: Excelente
- NPS 30-50: Bueno
- NPS 0-30: Regular
- NPS < 0: Problema crítico

**Salida**:
```javascript
{ nps: 42 } // rango: -100 a +100
```

**Código**: `calculateNPS()` en script.js

---

### 6. **Health Score Agent**
**Responsabilidad**: Evaluar salud integral de cada cuenta

**Entrada**:
```javascript
{
  account: { Product_Usage_Percentage, Open_Tickets, Avg_Resolution_Time, ... },
  periodData: [ ... ],
  npsData: [ ... ]
}
```

**Algoritmo Multi-Factor**:
```javascript
Health_Score = (
  Product_Usage_Score × 0.30 +
  NPS_Score × 0.20 +
  Support_Score × 0.20 +
  Engagement_Score × 0.15 +
  Renewal_Score × 0.15
) × 100

// Componentes individuales:

1. Product_Usage_Score = Product_Usage_Percentage / 100
   - Mide adopción de funcionalidades

2. NPS_Score = (Promedio_NPS_Cuenta + 10) / 20
   - Normaliza NPS (0-10) a rango 0-1

3. Support_Score = max(0, 1 - (Open_Tickets × 0.1))
   - Penaliza tickets abiertos (cada ticket -10%)

4. Engagement_Score = Días_Desde_Último_Contacto normalizados
   - Contacto reciente = score alto

5. Renewal_Score = Tasa de renovación de períodos anteriores
```

**Clasificación**:
- 80-100: 🟢 Excelente (verde)
- 60-79: 🟡 Bueno (amarillo)
- 40-59: 🟠 En Riesgo (naranja)
- 0-39: 🔴 Crítico (rojo)

**Salida**:
```javascript
{
  healthScore: 78.5,
  components: {
    productUsage: 85,
    nps: 80,
    support: 70,
    engagement: 75,
    renewal: 82
  }
}
```

**Código**: `calculateHealthScore(account, periodData, npsData)` en script.js

---

### 7. **Adoption Rate Agent**
**Responsabilidad**: Medir tasa de adopción del producto

**Entrada**:
```javascript
{
  Total_Licenses: 100,
  Active_Users: 85
}
```

**Algoritmo**:
```javascript
Adoption_Rate = (Active_Users / Total_Licenses) × 100
```

**Interpretación**:
- > 80%: Excelente adopción
- 60-80%: Buena adopción
- 40-60%: Adopción moderada
- < 40%: Baja adopción (oportunidad de capacitación)

**Salida**:
```javascript
{ adoptionRate: 85.0 } // en porcentaje
```

**Código**: `calculateAdoptionRateAccount(account)` en script.js

---

### 8. **Revenue at Risk Agent**
**Responsabilidad**: Identificar ingresos en riesgo de pérdida

**Entrada**:
```javascript
{
  accounts: [ ... ],
  calculatedMetrics: { healthScore, ... }
}
```

**Algoritmo**:
```javascript
Revenue_at_Risk = Σ (MRR_Current de cuentas con Health_Score < 50)

// Clasificación adicional por nivel de riesgo:
Critical_Risk = Σ (MRR donde Health_Score < 40)
Moderate_Risk = Σ (MRR donde Health_Score 40-50)
```

**Salida**:
```javascript
{
  revenueAtRisk: 7200,
  breakdown: {
    critical: 3200,
    moderate: 4000
  }
}
```

**Código**: `calculateRevenueAtRisk()` en script.js

---

### 9. **Renewal Rate Agent**
**Responsabilidad**: Calcular tasa de renovación de contratos

**Entrada**:
```javascript
excelData.periodData = [
  {
    Account_ID,
    Period,
    Clients_Eligible_for_Renewal,
    Clients_Renewed
  }
]
```

**Algoritmo**:
```javascript
Total_Eligible = Σ Clients_Eligible_for_Renewal
Total_Renewed = Σ Clients_Renewed

Renewal_Rate = (Total_Renewed / Total_Eligible) × 100
```

**Salida**:
```javascript
{ renewalRate: 87.5 } // en porcentaje
```

**Código**: `calculateRenewalRateAccount(periodData)` en script.js

---

## 🔄 Flujo de Datos

### Secuencia de Procesamiento

```
1. USER ACTION
   ↓
   Selección de archivo Excel
   ↓
2. FILE READER AGENT
   ↓
   - Validar formato
   - Extraer datos brutos
   ↓
3. DATA PARSER AGENT
   ↓
   - Normalizar datos
   - Validar integridad
   - Crear estructuras de datos
   ↓
4. CALCULATION ORCHESTRATOR
   ↓
   ┌─────────────────────────────────┐
   │  PARALLEL PROCESSING            │
   ├─────────────────────────────────┤
   │  → MRR Agent                    │
   │  → ARR Agent                    │
   │  → NRR Agent                    │
   │  → Churn Agent                  │
   │  → NPS Agent                    │
   │  → Revenue at Risk Agent        │
   └─────────────────────────────────┘
   ↓
5. ACCOUNT ANALYSIS LOOP
   ↓
   Para cada cuenta:
   ┌─────────────────────────────────┐
   │  → Health Score Agent           │
   │  → Adoption Rate Agent          │
   │  → Renewal Rate Agent           │
   │  → Risk Level Classifier        │
   └─────────────────────────────────┘
   ↓
6. AGGREGATION AGENT
   ↓
   - Consolidar todos los KPIs
   - Generar estructuras de salida
   ↓
7. RENDER AGENT
   ↓
   - Actualizar UI
   - Pintar gráficos
   - Actualizar tablas
   ↓
8. USER FEEDBACK
   ↓
   Dashboard actualizado con insights
```

### Estado del Sistema

```javascript
// Estado global almacenado en memoria
const systemState = {
  // Datos crudos del Excel
  excelData: {
    accounts: Array,      // Hoja "Accounts"
    periodData: Array,    // Hoja "Period_Data"
    npsData: Array        // Hoja "NPS_Data"
  },
  
  // Métricas calculadas
  calculatedMetrics: {
    kpis: {
      mrr: Number,
      arr: Number,
      nrr: Number,
      churn: Number,
      nps: Number,
      revenueAtRisk: Number,
      adoptionRate: Number
    },
    accountMetrics: [
      {
        ...accountData,
        healthScore: Number,
        adoptionRate: Number,
        renewalRate: Number,
        riskLevel: String
      }
    ]
  },
  
  // Metadatos
  metadata: {
    loadedAt: Timestamp,
    fileName: String,
    recordCount: Object
  }
};
```

---

## 🧮 Algoritmos de Cálculo

### Normalización de Datos

```javascript
function normalizeData(rawData, schema) {
  return rawData.map(record => {
    const normalized = {};
    
    for (const [key, config] of Object.entries(schema)) {
      const value = record[key];
      
      // Conversión de tipo
      if (config.type === 'number') {
        normalized[key] = parseFloat(value) || 0;
      } else if (config.type === 'date') {
        normalized[key] = new Date(value);
      } else {
        normalized[key] = String(value || '');
      }
      
      // Validación de rango
      if (config.min !== undefined && normalized[key] < config.min) {
        normalized[key] = config.min;
      }
      if (config.max !== undefined && normalized[key] > config.max) {
        normalized[key] = config.max;
      }
    }
    
    return normalized;
  });
}
```

### Agregación Temporal

```javascript
function getLatestPeriodData(periodData) {
  // Agrupar por período
  const byPeriod = groupBy(periodData, 'Period');
  
  // Ordenar períodos cronológicamente
  const periods = Object.keys(byPeriod).sort((a, b) => {
    return new Date(a) - new Date(b);
  });
  
  // Retornar el más reciente
  const latestPeriod = periods[periods.length - 1];
  return byPeriod[latestPeriod];
}
```

### Clasificación de Riesgo

```javascript
function getRiskLevel(healthScore) {
  if (healthScore >= 80) return { level: 'Excelente', color: 'green', icon: '🟢' };
  if (healthScore >= 60) return { level: 'Bueno', color: 'yellow', icon: '🟡' };
  if (healthScore >= 40) return { level: 'En Riesgo', color: 'orange', icon: '🟠' };
  return { level: 'Crítico', color: 'red', icon: '🔴' };
}
```

---

## 🔌 Extensibilidad

### Agregar un Nuevo Agente

Para agregar un nuevo agente de análisis al sistema:

#### 1. Definir el Agente

```javascript
// En script.js

/**
 * Customer Lifetime Value Agent
 * Calcula el valor del ciclo de vida del cliente
 */
function calculateCLV() {
  const averageMRR = calculatedMetrics.kpis.mrr / excelData.accounts.length;
  const averageLifetimeMonths = 36; // 3 años promedio
  const churnRate = calculatedMetrics.kpis.churn / 100;
  
  // Fórmula CLV simplificada
  const clv = (averageMRR / churnRate) * 12;
  
  console.log('CLV calculado:', clv);
  return clv;
}
```

#### 2. Integrar en calculateKPIs()

```javascript
function calculateKPIs() {
  // ... agentes existentes ...
  
  // Nuevo agente
  const clv = calculateCLV();
  
  calculatedMetrics.kpis = {
    // ... KPIs existentes ...
    clv: clv
  };
}
```

#### 3. Actualizar UI

```html
<!-- En index.html -->
<div class="kpi-card">
    <div class="kpi-label">CLV</div>
    <div class="kpi-value" id="clvValue">$0</div>
    <div class="kpi-subtitle">Customer Lifetime Value</div>
</div>
```

```javascript
// En renderDashboard()
document.getElementById('clvValue').textContent = 
  formatCurrency(calculatedMetrics.kpis.clv);
```

#### 4. Documentar

Agregar sección en este archivo (agents.md) con:
- Responsabilidad
- Entrada
- Algoritmo
- Salida
- Código de referencia

---

### Ejemplo: Agente de Predicción

```javascript
/**
 * CHURN PREDICTION AGENT
 * Predice probabilidad de churn en próximos 90 días
 */
function predictChurnRisk(account, periodData, npsData) {
  const features = {
    // Feature engineering
    healthScore: account.healthScore,
    trendMRR: calculateMRRTrend(account.Account_ID, periodData),
    npsChange: calculateNPSChange(account.Account_ID, npsData),
    ticketVolume: account.Open_Tickets,
    usageDecline: calculateUsageDecline(account.Account_ID, periodData),
    daysToRenewal: calculateDaysToRenewal(account.Renewal_Date)
  };
  
  // Modelo de scoring simple (podrías usar ML aquí)
  let churnScore = 0;
  
  if (features.healthScore < 50) churnScore += 30;
  if (features.trendMRR < 0) churnScore += 25;
  if (features.npsChange < -2) churnScore += 20;
  if (features.ticketVolume > 5) churnScore += 15;
  if (features.usageDecline > 20) churnScore += 10;
  
  return {
    churnProbability: Math.min(churnScore, 100),
    riskFactors: identifyRiskFactors(features),
    recommendedActions: generateRecommendations(features)
  };
}
```

---

## 📊 Monitoreo y Logging

### Sistema de Logging

```javascript
const Logger = {
  levels: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  },
  
  currentLevel: 1, // INFO
  
  log(level, agentName, message, data = null) {
    if (this.levels[level] >= this.currentLevel) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        agent: agentName,
        message,
        data
      };
      
      console.log(`[${timestamp}] [${level}] [${agentName}] ${message}`, data || '');
      
      // Podrías enviar a un servicio externo aquí
      // logToExternalService(logEntry);
    }
  },
  
  debug(agent, msg, data) { this.log('DEBUG', agent, msg, data); },
  info(agent, msg, data) { this.log('INFO', agent, msg, data); },
  warn(agent, msg, data) { this.log('WARN', agent, msg, data); },
  error(agent, msg, data) { this.log('ERROR', agent, msg, data); }
};

// Uso en agentes
function calculateMRR() {
  Logger.info('MRR Agent', 'Iniciando cálculo de MRR');
  
  const mrr = excelData.accounts.reduce((sum, account) => {
    const value = parseFloat(account.MRR_Current) || 0;
    return sum + value;
  }, 0);
  
  Logger.info('MRR Agent', 'Cálculo completado', { mrr });
  return mrr;
}
```

---

## 🎯 Mejores Prácticas

### 1. **Separación de Responsabilidades**
- Cada agente debe tener una única responsabilidad
- No mezclar lógica de cálculo con lógica de presentación

### 2. **Validación de Datos**
```javascript
function validateAccountData(account) {
  const required = ['Account_ID', 'MRR_Current', 'ARR_Current'];
  
  for (const field of required) {
    if (account[field] === undefined || account[field] === null) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }
  
  if (account.MRR_Current < 0) {
    throw new Error('MRR no puede ser negativo');
  }
  
  return true;
}
```

### 3. **Manejo de Errores**
```javascript
function safeCalculate(calculationFn, agentName, defaultValue = 0) {
  try {
    return calculationFn();
  } catch (error) {
    Logger.error(agentName, 'Error en cálculo', error);
    showMessage(`Error en ${agentName}: ${error.message}`, 'error');
    return defaultValue;
  }
}
```

### 4. **Testing**
```javascript
// Tests unitarios para agentes
function testMRRAgent() {
  const testData = [
    { Account_ID: 'ACC001', MRR_Current: 5000 },
    { Account_ID: 'ACC002', MRR_Current: 3000 }
  ];
  
  excelData.accounts = testData;
  const result = calculateMRR();
  
  console.assert(result === 8000, 'MRR Agent test failed');
  console.log('✓ MRR Agent test passed');
}
```

---

## 📚 Referencias

### Documentación Adicional
- [COMO_USAR.txt](COMO_USAR.txt) - Guía de usuario
- [ESTRUCTURA.txt](ESTRUCTURA.txt) - Estructura de datos
- [VALIDACION.txt](VALIDACION.txt) - Criterios de validación
- [README_GUIA.md](README_GUIA.md) - Guía completa del proyecto

### Recursos Externos
- **SheetJS Documentation**: https://docs.sheetjs.com/
- **SaaS Metrics Guide**: https://www.saasmetrics.co/
- **Customer Success Metrics**: https://www.gainsight.com/guides/

### Fórmulas de Referencia
- **NRR**: [(MRR_Inicio + Expansión - Contracción - Churn) / MRR_Inicio] × 100
- **NPS**: % Promotores (9-10) - % Detractores (0-6)
- **Churn Rate**: (Clientes_Perdidos / Clientes_Inicio) × 100
- **CLV**: (Margen_Promedio / Tasa_Churn) × 12

---

## 🔮 Roadmap de Agentes Futuros

### Fase 2: Agentes Predictivos
- [ ] **Churn Prediction Agent**: ML para predecir abandono
- [ ] **Upsell Opportunity Agent**: Identificar oportunidades de expansión
- [ ] **Health Trend Agent**: Predecir evolución de health score

### Fase 3: Agentes de Automatización
- [ ] **Alert Agent**: Notificaciones automáticas de cambios críticos
- [ ] **Report Generation Agent**: Informes automáticos periódicos
- [ ] **Recommendation Agent**: Sugerencias accionables basadas en datos

### Fase 4: Agentes Avanzados
- [ ] **Cohort Analysis Agent**: Análisis de cohortes de clientes
- [ ] **Segmentation Agent**: Segmentación inteligente de clientes
- [ ] **Benchmark Agent**: Comparación con estándares de industria

---

## 💡 Contribuir

Para contribuir nuevos agentes o mejorar los existentes:

1. **Fork** el proyecto
2. **Diseña** el agente siguiendo los patrones establecidos
3. **Implementa** con testing adecuado
4. **Documenta** en este archivo
5. **Crea** un pull request

---

**Última actualización**: Febrero 2026  
**Versión del Sistema**: 1.0  
**Autor**: Sistema de Análisis de Comportamiento de Cliente  
**Licencia**: MIT

