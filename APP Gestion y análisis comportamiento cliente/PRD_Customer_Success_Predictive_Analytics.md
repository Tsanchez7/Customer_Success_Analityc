Documento enfocado a producto SaaS de Customer Success Analytics.

📄 PRODUCT REQUIREMENTS DOCUMENT (PRD)
📌 Proyecto

Customer Success Predictive Analytics Module

📅 Versión

v1.0

👤 Owner

Product Team – Customer Success Intelligence

1. 🎯 Objetivo del Producto

Desarrollar un módulo de analítica de tendencias que complemente los KPIs actuales (MRR, NRR, Churn, Health Score, Adoption Rate, Revenue at Risk), permitiendo:

Detectar riesgo temprano de churn

Identificar desaceleración en adopción

Medir estabilidad de ingresos recurrentes

Generar alertas predictivas automáticas

El módulo transformará el sistema de un dashboard descriptivo a un sistema de monitoreo predictivo.

2. 📊 Alcance Funcional

El módulo incluirá 4 métricas de tendencia:

Health Score Trend

NRR Trend

Adoption Momentum

Revenue Risk Trend

Frecuencia de cálculo: mensual
Histórico mínimo requerido: 3 meses

3. 📈 Definición de Métricas
3.1 Health Score Trend
Descripción

Mide la evolución del Health Score por cuenta para detectar deterioro progresivo.

Fórmulas

Health_Trend = (Health_t - Health_t-n) / n

Health_Trend_% = ((Health_t - Health_t-n) / Health_t-n) × 100

Donde:

t = mes actual

n = número de meses comparados (default: 3)

Reglas de Negocio

Si Health_Trend_% < -10% → Estado: “Deterioro Activo”

Si Health_Trend_% > 5% → Estado: “Recuperación”

En otro caso → “Estable”

3.2 NRR Trend
Descripción

Evalúa la evolución de la retención neta de ingresos.

Fórmulas

NRR = ((MRR_inicio + Expansión - Contracción - Churn) / MRR_inicio) × 100

NRR_Trend = NRR_t - NRR_t-1

Media móvil 3 meses:

NRR_Trend_3m = (NRR_t + NRR_t-1 + NRR_t-2) / 3

Reglas de Negocio

NRR_Trend < 0 durante 2 meses consecutivos → “Riesgo Sistémico”

NRR < 100% sostenido → “Contracción Estructural”

3.3 Adoption Momentum
Descripción

Mide aceleración o desaceleración en la tasa de adopción.

Fórmulas

Adoption_Growth = (Adoption_t - Adoption_t-1) / Adoption_t-1

Adoption_Momentum = Adoption_Growth_t - Adoption_Growth_t-1