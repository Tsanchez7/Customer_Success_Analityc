# 📊 Dashboard de Gestión de Cuentas Cliente

Aplicación web local para analizar y calcular KPIs de gestión de cuentas clientes usando datos de Excel.

## 🚀 Características

- ✅ Carga de archivos Excel (.xlsx) directamente en el navegador
- ✅ Sin backend (todo funciona en local)
- ✅ Sin frameworks (HTML, CSS y JavaScript puro)
- ✅ Cálculo automático de KPIs
- ✅ Análisis por cuenta individual
- ✅ Health Score con múltiples componentes
- ✅ Interfaz moderna y responsive

## 📊 KPIs Calculados

### Global
- **MRR**: Suma de ingresos recurrentes mensuales
- **ARR**: MRR × 12 (Ingresos recurrentes anuales)
- **NRR**: Tasa de retención neta
- **Churn Rate**: Porcentaje de clientes perdidos
- **NPS**: Net Promoter Score
- **Revenue at Risk**: Ingresos en riesgo (Health Score < 70)
- **Adoption Rate**: Usuarios activos / Licencias totales

### Por Cuenta
- **Health Score**: Métrica compuesta (0-100%)
  - Product Usage: 30%
  - NPS: 20%
  - Ticket Score: 20%
  - Engagement Score: 15%
  - Renewal Score: 15%
- **Adoption Rate**: Tasa de adopción específica
- **Risk Level**: Clasificación de riesgo

## 📁 Estructura de Archivos

```
├── index.html       # HTML principal
├── style.css        # Estilos CSS
├── script.js        # Lógica JavaScript
├── README.md        # Este archivo
└── datos_ejemplo.xlsx (opcional - para pruebas)
```

## 🛠️ Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Archivo Excel (.xlsx) con las siguientes hojas:
  - **Accounts**
  - **Period_Data**
  - **NPS_Data**

## 📋 Estructura del Excel

### Hoja 1: Accounts
```
Account_ID              (ID único)
Account_Name            (Nombre cuenta)
MRR_Current             (Ingresos mensuales actual)
ARR_Current             (Ingresos anuales actual)
Renewal_Date            (Fecha de renovación)
Total_Licenses          (Licencias totales)
Active_Users            (Usuarios activos)
Product_Usage_Percentage (% de uso del producto)
Open_Tickets            (Tickets abiertos)
Avg_Resolution_Time     (Tiempo promedio resolución)
Last_Contact_Date       (Última fecha de contacto)
```

### Hoja 2: Period_Data
```
Account_ID              (ID de cuenta)
Period                  (Período)
MRR_Starting            (MRR inicial)
Expansion_Revenue       (Ingresos expansión)
Contraction_Revenue     (Ingresos contracción)
Churned_Revenue         (Ingresos perdidos)
Clients_Start_Period    (Clientes al inicio)
Clients_Churned         (Clientes perdidos)
Clients_Eligible_for_Renewal  (Clientes elegibles renovación)
Clients_Renewed         (Clientes renovados)
```

### Hoja 3: NPS_Data
```
Account_ID              (ID de cuenta)
Period                  (Período)
NPS_Response            (Respuesta NPS 0-10)
```

## 🎯 Cómo Usar

1. **Abre `index.html`** en tu navegador (haz doble clic o arrastra a navegador)

2. **Carga tu archivo Excel** haciendo clic en el botón "📁 Cargar Excel"

3. **Verifica los resultados**:
   - Panel superior: KPIs globales
   - Tabla: Análisis por cuenta

## 🎨 Interpretación de Colores

### Health Score
- 🟢 Excelente (≥85%): Verde
- 🟡 Bueno (70-84%): Verde claro
- 🟠 Advertencia (50-69%): Naranja
- 🔴 Crítico (<50%): Rojo

### Nivel de Riesgo
- ✓ Bajo: Verde
- ⚠ Medio: Naranja
- ⚠ Alto: Naranja oscuro
- 🔴 Crítico: Rojo

## 🔧 Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Diseño moderno y responsive
- **JavaScript Vanilla**: Lógica de aplicación
- **SheetJS**: Lectura de archivos Excel

## 📦 Dependencias Externas

La aplicación usa SheetJS desde CDN:
```
https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js
```

## ✨ Características Destacadas

- ✅ Carga local (sin servidor necesario)
- ✅ Interfaz intuitiva y moderna
- ✅ Cálculos precisos de KPIs
- ✅ Totalmente responsive
- ✅ Rendimiento rápido
- ✅ Código limpio y bien documentado

## 🐛 Solución de Problemas

### "Error: No se encontraron datos en la hoja 'Accounts'"
- Verifica que el Excel tenga una hoja llamada exactamente "Accounts"
- Comprueba que tiene datos en las columnas correctas

### El gráfico no carga
- Asegúrate de tener conexión a internet (para SheetJS)
- Prueba en un navegador diferente

### Las fechas no se muestran correctamente
- Verifica que el formato de fechas en Excel sea estándar (YYYY-MM-DD)

## 📝 Notas

- La aplicación **no envía datos** a ningún servidor
- Todo se procesa **localmente en tu navegador**
- Los datos se borran al cerrar o actualizar la página
- Compatible con Excel 2007 y posteriores

## 👨‍💻 Desarrollo Futuro

Posibles mejoras:
- Exportar reportes a PDF
- Gráficos interactivos
- Filtros por período
- Descarga de resumen
- Conexión a bases de datos

---

**Desarrollado con HTML, CSS y JavaScript puro** 🚀
Versión 1.0 • Febrero 2026
