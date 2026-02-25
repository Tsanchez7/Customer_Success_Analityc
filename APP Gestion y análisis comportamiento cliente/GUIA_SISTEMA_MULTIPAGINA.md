# 📊 Guía del Sistema Multi-Página

## 🎯 Resumen

Tu dashboard ahora está dividido en **3 páginas interconectadas** que comparten datos automáticamente:

1. **📈 Historial (10 años)** - Análisis histórico completo
2. **📍 Actualidad (2026)** - Estado actual y métricas del año en curso
3. **🔮 Tendencias** - Proyecciones y análisis predictivo para 2027

---

## ✨ Características Nuevas

### 🔄 Sincronización Automática
- **Carga una vez, visualiza en todas**: Cuando cargas el Excel en cualquier página, los datos se guardan automáticamente en localStorage
- **Persistencia**: Los datos permanecen cargados incluso si cierras el navegador
- **Recarga automática**: Al abrir cualquier página, los datos se cargan automáticamente sin necesidad de volver a subir el archivo

### 📊 Tabla Mejorada de Datos Anuales

**Mejoras visuales:**
- ✅ **Tendencias visuales**: Iconos que muestran si cada métrica mejoró, empeoró o se mantuvo vs el año anterior
  - 📈 = Mejoró
  - 📉 = Empeoró  
  - ➡️ = Sin cambios
  - ⚠️ = Alerta (para churn)

- 🎨 **Colores inteligentes**:
  - Verde: Métricas excelentes
  - Amarillo: Métricas aceptables
  - Rojo: Métricas críticas

- 📝 **Clasificaciones automáticas**:
  - NRR: "Crecimiento neto" o "Contracción neta"
  - Churn: "Excelente", "Aceptable" o "Crítico"
  - NPS: "Promotores", "Pasivos" o "Detractores"

- 🖱️ **Interactividad**:
  - Efecto hover mejorado en cada fila
  - Animación suave al pasar el mouse
  - Resaltado del año completo

---

## 🚀 Cómo Usar el Sistema

### Paso 1: Generar Datos
1. Abre **generar_datos_10años.html**
2. Haz clic en "🚀 Generar Excel con 10 Años de Datos"
3. Se descargará `datos_historicos_10años.xlsx`

### Paso 2: Cargar Datos (Solo una vez)
1. Abre cualquiera de las 3 páginas
2. Haz clic en el botón **"📂 Cargar Excel"** en la barra de navegación
3. Selecciona el archivo generado
4. Verás el mensaje: ✅ "Datos cargados correctamente y sincronizados"

### Paso 3: Navegar Entre Páginas
1. Usa el menú de navegación superior para cambiar entre páginas
2. Los datos ya estarán cargados automáticamente en todas las páginas
3. No necesitas volver a cargar el Excel

---

## 📄 Descripción de Cada Página

### 1️⃣ Historial (1_historial.html)

**Contenido:**
- 📊 **Comparativa Década**: MRR inicial vs final, crecimiento total, CAGR
- 📈 **5 Gráficos históricos**: MRR, NRR, Churn, NPS, ARR (2016-2026)
- 📋 **Tabla consolidada por año**: Todas las métricas con tendencias visuales
- 🏆 **Hitos destacados**: Mejores años para cada métrica

**Ideal para:**
- Análisis de crecimiento a largo plazo
- Identificar patrones históricos
- Presentaciones ejecutivas

---

### 2️⃣ Actualidad (2_actualidad.html)

**Contenido:**
- 💎 **6 KPIs principales**: MRR, ARR, NRR, Churn, NPS, Revenue at Risk
- 📊 **Comparación año a año**: Cambio porcentual vs 2025
- ⚠️ **Análisis de riesgo**: 4 niveles (Excelente, Bueno, En Riesgo, Crítico)
- 💰 **Distribución de revenue**: Por nivel de riesgo con barras animadas
- 📈 **Evolución trimestral 2026**: MRR y NRR por trimestre
- 📋 **Tabla de cuentas activas**: Detalle completo de cada cliente

**Ideal para:**
- Revisiones semanales/mensuales
- Identificar cuentas en riesgo
- Seguimiento de health score

---

### 3️⃣ Tendencias (3_tendencias.html)

**Contenido:**
- 🔮 **Proyecciones 2027**: MRR, ARR, Churn, NPS con rangos de confianza
- 📊 **Gráficos predictivos**: Histórico + proyección futura
- 🎯 **Análisis de tendencias**: Positivas, negativas y estables
- 💡 **Recomendaciones estratégicas**: Acciones priorizadas (alta/media/baja)
- 🎲 **3 Escenarios**:
  - 🚀 **Optimista**: +25% crecimiento, -30% churn
  - 🎯 **Realista**: Mantener tendencia actual
  - ⚠️ **Pesimista**: -15% crecimiento, +50% churn

**Ideal para:**
- Planificación estratégica
- Presupuestos anuales
- Análisis "what-if"

---

## 🎨 Navegación Visual

```
┌─────────────────────────────────────────────────────────┐
│  📊 Dashboard Customer Success                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐  [📂 Cargar]│
│  │📈 Historial││📍Actualidad││🔮Tendencias│             │
│  └───────────┘ └───────────┘ └───────────┘             │
└─────────────────────────────────────────────────────────┘
```

- La página activa se resalta en **blanco brillante**
- Las páginas inactivas son translúcidas
- Hover para efecto visual

---

## 🔧 Funcionalidades Técnicas

### localStorage
- **Clave**: `customerSuccessData`
- **Contenido**: 
  ```json
  {
    "accounts": [...],
    "periodData": [...],
    "npsData": [...],
    "timestamp": "2026-02-24T10:30:00.000Z"
  }
  ```
- **Tamaño aproximado**: ~500KB para 10 años de datos
- **Persistencia**: Hasta que borres el caché del navegador

### Sincronización
1. **Carga en Página A** → Guarda en localStorage
2. **Abres Página B** → Lee de localStorage automáticamente
3. **Carga en Página B** → Actualiza localStorage para todas

---

## 📊 Estructura de Datos Generados

### Cuentas (7)
- **2 Excelentes**: Health Score 85-95
- **2 Buenas**: Health Score 65-75
- **2 En Riesgo**: Health Score 45-55
- **1 Crítica**: Health Score 25-35

### Datos de Período
- **40 trimestres**: 2016-Q1 a 2026-Q1
- **280 registros**: 7 cuentas × 40 trimestres
- **Métricas**: MRR, Expansión, Contracción, Churn, Renovaciones

### Datos NPS
- **~560 respuestas**: 1-2 por cuenta por trimestre
- **Distribuidas según health**:
  - Excelente: 9-10
  - Buena: 7-9
  - En Riesgo: 4-7
  - Crítica: 0-4

---

## 💡 Casos de Uso

### Para CSMs (Customer Success Managers)
- **Actualidad**: Revisa diariamente qué cuentas necesitan atención
- **Historial**: Prepara QBRs (Quarterly Business Reviews)
- **Tendencias**: Identifica oportunidades de expansión

### Para Directores/VPs
- **Historial**: Evalúa crecimiento y ROI del equipo CS
- **Actualidad**: Monitorea revenue at risk
- **Tendencias**: Planifica contrataciones y presupuesto

### Para Ejecutivos/CEOs
- **Historial**: Presenta al board el crecimiento histórico
- **Tendencias**: Proyecta ARR para próximo año fiscal
- **Actualidad**: Dashboard ejecutivo semanal

---

## 🐛 Troubleshooting

### Problema: "Los datos no se cargan automáticamente"
**Solución**: 
- Verifica que estés en el mismo navegador
- localStorage es específico por dominio y navegador
- Prueba cargar el Excel nuevamente en cualquier página

### Problema: "La tabla se ve desalineada"
**Solución**:
- Refresca la página (Ctrl+F5)
- Verifica que los archivos CSS estén cargados
- Abre la consola (F12) para ver errores

### Problema: "Los gráficos no aparecen"
**Solución**:
- Verifica conexión a internet (Chart.js se carga desde CDN)
- Revisa la consola del navegador (F12)
- Espera 2-3 segundos después de cargar el Excel

### Problema: "Quiero borrar los datos guardados"
**Solución**:
```javascript
// Ejecuta esto en la consola del navegador:
localStorage.removeItem('customerSuccessData');
// Luego refresca la página
```

---

## 🎯 Roadmap Futuro

### Próximas Mejoras Posibles
- [ ] Exportar reportes a PDF
- [ ] Compartir análisis por email
- [ ] Comparar múltiples períodos
- [ ] Alertas automáticas por email
- [ ] Integración con CRM (Salesforce, HubSpot)
- [ ] Dashboard móvil responsive
- [ ] Modo oscuro
- [ ] Filtros avanzados por industria, CSM, tamaño

---

## 📚 Recursos Adicionales

### Archivos del Proyecto
- **HTML**: `1_historial.html`, `2_actualidad.html`, `3_tendencias.html`
- **JavaScript**: `script_historial.js`, `script_actualidad.js`, `script_tendencias.js`
- **CSS**: `style.css`, `navigation.css`
- **Generador**: `generar_datos_10años.html`

### Documentación
- `agents.md` - Arquitectura de agentes de análisis
- `COMO_USAR.txt` - Guía básica de uso
- `ESTRUCTURA.txt` - Estructura de datos del Excel

---

## 🎉 ¡Listo para Usar!

Tu sistema ahora es:
- ✅ **Multi-página** con navegación fluida
- ✅ **Sincronizado** automáticamente
- ✅ **Visual** con tablas mejoradas e iconos de tendencias
- ✅ **Persistente** - los datos sobreviven recargas
- ✅ **Completo** - 10 años de datos históricos

**¡Empieza ahora!**
1. Genera el Excel → 2. Cárgalo en cualquier página → 3. Navega libremente

---

*Última actualización: Febrero 2026*
