# 📊 Dashboard de Gestión y Análisis de Comportamiento Cliente

Aplicación web local para analizar KPIs de gestión de cuentas clientes. Carga archivos Excel (.xlsx), calcula automáticamente métricas y proporciona un análisis visual interactivo.

## ⚡ Inicio Rápido

1. **Abre `generar_datos.html`** en tu navegador para descargar un archivo Excel de ejemplo
2. **Abre `index.html`** en tu navegador (tu dashboard)
3. **Carga el Excel** usando el botón "📁 Cargar Excel"
4. **¡Explora los resultados!**

## 📁 Archivos de la Aplicación

| Archivo | Descripción |
|---------|------------|
| `index.html` | Dashboard principal |
| `style.css` | Estilos CSS modernos |
| `script.js` | Lógica JavaScript de cálculos |
| `generar_datos.html` | Generador de Excel de ejemplo |
| `README_GUIA.md` | Guía detallada |

## 🎯 Características

✅ **Sin instalaciones** - Funciona directamente en el navegador
✅ **Sin backend** - Todo procesamiento local
✅ **Sin frameworks** - HTML, CSS y JavaScript puro
✅ **Respuesta rápida** - Cálculos instantáneos
✅ **Interfaz moderna** - Diseño limpio y profesional
✅ **Responsive** - Funciona en cualquier dispositivo

## 📊 KPIs Calculados

### Globales
- **MRR**: Ingresos Recurrentes Mensuales (suma MRR_Current)
- **ARR**: Ingresos Recurrentes Anuales (MRR × 12)
- **NRR**: Tasa de Retención Neta
- **Churn Rate**: Porcentaje de pérdida de clientes
- **NPS**: Net Promoter Score (Promoters - Detractors)
- **Revenue at Risk**: Ingresos en riesgo (Health Score < 70)
- **Adoption Rate**: Tasa de adopción general

### Por Cuenta
- **Health Score**: Métrica compuesta de salud (0-100%)
  - Product Usage: 30%
  - NPS Normalizado: 20%
  - Ticket Score: 20%
  - Engagement Score: 15%
  - Renewal Score: 15%
- **Adoption Rate**: Tasa de adopción específica
- **Nivel de Riesgo**: Clasificación de riesgo

## 🔧 Estructura del Excel

El archivo Excel debe tener exactamente estas tres hojas y columnas:

### Hoja 1: Accounts
```
Account_ID, Account_Name, MRR_Current, ARR_Current, Renewal_Date,
Total_Licenses, Active_Users, Product_Usage_Percentage, Open_Tickets,
Avg_Resolution_Time, Last_Contact_Date
```

### Hoja 2: Period_Data
```
Account_ID, Period, MRR_Starting, Expansion_Revenue, Contraction_Revenue,
Churned_Revenue, Clients_Start_Period, Clients_Churned,
Clients_Eligible_for_Renewal, Clients_Renewed
```

### Hoja 3: NPS_Data
```
Account_ID, Period, NPS_Response (0-10)
```

## 💡 Ejemplos de Uso

### 1. Descarga datos de ejemplo
```
✓ Abre generar_datos.html en el navegador
✓ Clic en "Descargar Excel de Ejemplo"
✓ Se descargará: datos_ejemplo.xlsx
```

### 2. Usa el dashboard
```
✓ Abre index.html en el navegador
✓ Clic en "Cargar Excel"
✓ Selecciona tu archivo Excel
✓ Visualiza los KPIs y análisis
```

### 3. Interpreta los resultados
```
✓ Superior: 6 tarjetas con KPIs globales
✓ Inferior: Tabla con análisis por cuenta
✓ Colores indican nivel de riesgo
```

## 📈 Fórmulas Utilizadas

### MRR
```
MRR = SUM(Accounts.MRR_Current)
```

### NRR
```
NRR = (MRR_Starting + Expansion - Contraction - Churned) / MRR_Starting × 100
```

### Churn Rate
```
Churn Rate = Clients_Churned / Clients_Start_Period × 100
```

### NPS
```
Promoters = COUNT(NPS_Response >= 9)
Detractors = COUNT(NPS_Response <= 6)
NPS = (Promoters - Detractors) / Total × 100
```

### Health Score
```
HealthScore = (ProductUsage × 0.30) + (NPSNorm × 0.20) + (TicketScore × 0.20)
            + (EngagementScore × 0.15) + (RenewalScore × 0.15)

where:
- ProductUsage = Product_Usage_Percentage / 100
- NPSNorm = (NPS + 100) / 200
- TicketScore = 1 if OpenTickets ≤ 5, else 0.3
- EngagementScore = based on days since last contact
- RenewalScore = Clients_Renewed / Clients_Eligible_for_Renewal
```

## 🎨 Interpretación Visual

### Health Score por Cuenta
| Score | Clasificación | Color |
|-------|---------------|-------|
| ≥ 85% | Excelente | 🟢 Verde |
| 70-84% | Bueno | 🟡 Verde claro |
| 50-69% | Advertencia | 🟠 Naranja |
| < 50% | Crítico | 🔴 Rojo |

### Nivel de Riesgo
| Riesgo | Color | Descripción |
|--------|-------|-------------|
| Bajo | Verde | ✓ Todo en orden |
| Medio | Naranja | ⚠ Monitorear |
| Alto | Naranja oscuro | ⚠ Atención requerida |
| Crítico | Rojo | 🔴 Acción inmediata |

## 🔒 Seguridad y Privacidad

✅ **No se envía datos a servidor** - Todo queda en tu máquina
✅ **SQL localmente** - Cálculos en tiempo real
✅ **No se almacenan datos** - Solo mientras el navegador está abierto
✅ **Funciona sin conexión** - Tras cargar SheetJS

## 📱 Compatibilidad

| Navegador | Compatible |
|-----------|-----------|
| Chrome | ✅ Sí |
| Firefox | ✅ Sí |
| Safari | ✅ Sí |
| Edge | ✅ Sí |
| Opera | ✅ Sí |

## 🧮 Archivos Incluidos

```
├── index.html              ← Abre esto para el dashboard
├── style.css               ← Estilos CSS
├── script.js               ← Lógica JavaScript
├── generar_datos.html      ← Generador de datos ejemplo
├── README_GUIA.md          ← Guía completa
├── readme.md               ← Este archivo
├── generar_excel.py        ← Script generador (opcional)
└── datos_ejemplo.xlsx      ← Se descarga de generar_datos.html
```

## 🐛 Solución de Problemas

### "Error: No se encontraron datos en la hoja 'Accounts'"
**Solución**: Verifica que el Excel tenga 3 hojas: Accounts, Period_Data, NPS_Data

### El dashboard no carga datos
**Solución**: Asegúrate de tener conexión a internet (SheetJS se carga desde CDN)

### Cifras no se muestran correctamente
**Solución**: Usa formato de números estándar en Excel (no texto)

### Fechas mostradas incorrectamente
**Solución**: Usa formato de fechas YYYY-MM-DD en Excel

### Archivo no se carga
**Solución**: 
1. Abre la consola (F12)
2. Verifica los mensajes de error
3. Prueba con datos de ejemplo

## 🛠️ Personalización Avanzada

Puedes editar `script.js` para:

```javascript
// Cambiar pesos de Health Score
productUsage: 0.30,
npsWeight: 0.20,
ticketWeight: 0.20,
engagementWeight: 0.15,
renewalWeight: 0.15

// Modificar umbrales de riesgo
if (healthScore < 50) return 'critical';
if (healthScore < 70) return 'high';
```

## 📚 Documentación Completa

Para más detalles, consulta **`README_GUIA.md`**

## ✨ Versión y Créditos

**Dashboard de Gestión de Cuentas**
- Versión: 1.0
- Fecha: Febrero 2026
- Tecnología: HTML5 + CSS3 + JavaScript Vanilla + SheetJS

---

**Desarrollado con ❤️ usando HTML, CSS y JavaScript puro**

**SIN BACKEND • SIN FRAMEWORKS • TODO LOCAL**