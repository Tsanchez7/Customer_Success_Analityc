# 📊 Guía para Generar Excel para la Aplicación

## 🚀 Opción 1: Usar el Generador Automático (RECOMENDADO)

### Pasos:
1. **Abre el archivo** [generar_excel_offline.html](generar_excel_offline.html)
2. **Haz clic en** "📥 Generar y Descargar Excel"
3. Se descargará automáticamente: `datos_gestion_clientes.xlsx`
4. **¡Listo!** Ya puedes cargar este archivo en [index.html](index.html)

---

## 📋 Estructura del Excel Generado

El archivo Excel contiene **3 hojas (sheets)** con los siguientes datos:

### 🏢 Hoja 1: **Accounts** (Cuentas)
Información general de cada cuenta de cliente.

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `Account_ID` | Identificador único | ACC001 |
| `Account_Name` | Nombre de la empresa | Empresa Tech SA |
| `MRR_Current` | Ingresos recurrentes mensuales actuales | 5000 |
| `ARR_Current` | Ingresos recurrentes anuales | 60000 |
| `Renewal_Date` | Fecha de renovación | 2026-04-20 |
| `Total_Licenses` | Licencias totales contratadas | 100 |
| `Active_Users` | Usuarios activos | 85 |
| `Product_Usage_Percentage` | Porcentaje de uso del producto | 78.5 |
| `Open_Tickets` | Tickets de soporte abiertos | 2 |
| `Avg_Resolution_Time` | Tiempo promedio de resolución (días) | 2.5 |
| `Last_Contact_Date` | Última fecha de contacto | 2026-02-15 |

**Ejemplo de datos:**
```
ACC001, Empresa Tech SA, 5000, 60000, 2026-04-20, 100, 85, 78.5, 2, 2.5, 2026-02-15
ACC002, Digital Solutions Inc, 8500, 102000, 2026-06-20, 200, 140, 92.0, 1, 1.8, 2026-02-18
```

---

### 📈 Hoja 2: **Period_Data** (Datos por Período)
Datos de evolución de cada cuenta en diferentes períodos.

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `Account_ID` | ID de la cuenta | ACC001 |
| `Period` | Período (trimestre) | 2026-Q1 |
| `MRR_Starting` | MRR al inicio del período | 5200 |
| `Expansion_Revenue` | Ingresos por expansión/upsell | 300 |
| `Contraction_Revenue` | Ingresos perdidos por downsell | 50 |
| `Churned_Revenue` | Ingresos perdidos por abandono | 0 |
| `Clients_Start_Period` | Clientes al inicio del período | 85 |
| `Clients_Churned` | Clientes que abandonaron | 0 |
| `Clients_Eligible_for_Renewal` | Clientes elegibles para renovar | 12 |
| `Clients_Renewed` | Clientes que renovaron | 11 |

**Ejemplo de datos:**
```
ACC001, 2026-Q1, 5200, 300, 50, 0, 85, 0, 12, 11
ACC002, 2026-Q1, 8600, 600, 200, 0, 160, 1, 20, 19
```

---

### ⭐ Hoja 3: **NPS_Data** (Net Promoter Score)
Respuestas de satisfacción de clientes (escala 0-10).

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `Account_ID` | ID de la cuenta | ACC001 |
| `Period` | Período de la respuesta | 2026-Q1 |
| `NPS_Response` | Puntuación NPS (0-10) | 8 |

**Interpretación NPS:**
- **9-10**: Promotores (clientes muy satisfechos)
- **7-8**: Pasivos (satisfechos pero no entusiastas)
- **0-6**: Detractores (clientes insatisfechos)

**Ejemplo de datos:**
```
ACC001, 2026-Q1, 8
ACC002, 2026-Q1, 9
ACC003, 2026-Q1, 6
```

---

## 🔧 Opción 2: Crear tu Propio Excel

Si quieres crear tu propio archivo Excel con tus datos reales:

### 1. Crea un archivo Excel (.xlsx)
### 2. Crea 3 hojas con estos nombres exactos:
   - `Accounts`
   - `Period_Data`
   - `NPS_Data`

### 3. En cada hoja, copia las columnas exactas indicadas arriba
### 4. Rellena con tus datos siguiendo el formato

### ⚠️ Reglas Importantes:
- **Los nombres de las hojas deben ser exactos** (mayúsculas/minúsculas)
- **Los nombres de columnas deben coincidir exactamente**
- Las fechas deben estar en formato: `YYYY-MM-DD` (ej: 2026-04-20)
- Los valores numéricos no deben llevar símbolos ($, %, etc.)
- El `Account_ID` debe ser único y consistente en las 3 hojas
- NPS_Response debe ser un número entre 0 y 10

---

## 📊 KPIs que Calculará la Aplicación

Una vez cargues el Excel en [index.html](index.html), la aplicación calculará automáticamente:

### KPIs Globales:
- **MRR**: Monthly Recurring Revenue (suma de todos los MRR actuales)
- **ARR**: Annual Recurring Revenue (MRR × 12)
- **NRR**: Net Revenue Retention (retención de ingresos considerando expansión/contracción)
- **Churn Rate**: Tasa de abandono de clientes
- **NPS**: Net Promoter Score promedio
- **Revenue at Risk**: Ingresos en riesgo por cuentas con bajo health score

### Métricas por Cuenta:
- **Health Score**: Puntuación de salud (0-100) basada en:
  - Uso del producto (30%)
  - NPS (20%)
  - Tickets de soporte (20%)
  - Engagement (15%)
  - Tasa de renovación (15%)
- **Adoption Rate**: Tasa de adopción (usuarios activos / licencias totales)
- **Renewal Rate**: Tasa de renovación de contratos
- **Risk Level**: Nivel de riesgo (Excelente, Bueno, En Riesgo, Crítico)

---

## 🎯 Flujo Completo de Uso

```
1. generar_excel_offline.html
   ↓
2. Descargar datos_gestion_clientes.xlsx
   ↓
3. index.html
   ↓
4. Cargar Excel
   ↓
5. Ver KPIs calculados automáticamente
   ↓
6. Analizar Health Score de cada cuenta
   ↓
7. Identificar cuentas en riesgo
   ↓
8. Tomar decisiones basadas en datos
```

---

## ✅ Datos de Ejemplo Incluidos

El Excel generado incluye 5 cuentas de ejemplo:
- **ACC001**: Empresa Tech SA - Health Score alto (78.5%)
- **ACC002**: Digital Solutions Inc - Excelente adopción (92%)
- **ACC003**: Cloud Services Ltd - En riesgo (55.3%)
- **ACC004**: Innovation Labs - Muy buena cuenta (88.7%)
- **ACC005**: Global Ventures - Cuenta crítica (45.2%)

Total MRR: **$27,000** | Total ARR: **$336,000**

---

## 🆘 Solución de Problemas

### ❌ El Excel no se carga en index.html
**Solución**: Verifica que el archivo tenga exactamente 3 hojas con los nombres correctos: `Accounts`, `Period_Data`, `NPS_Data`

### ❌ Los datos no se muestran correctamente
**Solución**: Revisa que los nombres de las columnas coincidan exactamente con los especificados

### ❌ El botón de descarga no funciona
**Solución**: Verifica tu conexión a internet (necesita cargar SheetJS desde CDN)

### ❌ Error "Sheet not found"
**Solución**: Los nombres de las hojas deben ser exactos: `Accounts` (no "accounts" ni "Cuentas")

---

## 📞 Contacto y Soporte

Para más información, revisa:
- [README_GUIA.md](README_GUIA.md) - Guía completa del proyecto
- [INSTRUCCIONES.txt](INSTRUCCIONES.txt) - Instrucciones rápidas
- [agents.md](agents.md) - Documentación técnica de agentes

---

**Última actualización**: Febrero 2026  
**Versión**: 1.0  
**Licencia**: MIT
