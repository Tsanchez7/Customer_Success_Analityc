// ===== SCRIPT PARA PÁGINA DE TENDENCIAS Y PREVISIÓN 2027 =====

/* VARIABLES GLOBALES */
let excelData = {
    accounts: [],
    periodData: [],
    npsData: []
};

let charts = {
    mrrForecast: null,
    nrrForecast: null,
    churnForecast: null
};

/* ===== EVENT LISTENERS ===== */
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('excelFile');
    fileInput.addEventListener('change', handleFileUpload);
    
    // Intentar cargar datos guardados al iniciar
    loadFromLocalStorage();
});

/* ===== FILE HANDLING ===== */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Si ya hay datos cargados, pedir confirmación (saltamos si es modo demo)
    if (excelData.accounts.length > 0) {
        if (!window.isDemoData) {
            const confirmed = confirm(
                '⚠️ Ya hay un archivo cargado.\n\n' +
                '¿Desea cargar un nuevo archivo?\n' +
                'Los datos actuales se reemplazarán completamente.'
            );
            if (!confirmed) {
                event.target.value = '';
                return;
            }
        }
        clearAllData();
    }

    showMessage('Cargando archivo...', 'loading');
    document.getElementById('fileName').textContent = file.name;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            excelData.accounts = XLSX.utils.sheet_to_json(workbook.Sheets['Accounts']);
            excelData.periodData = XLSX.utils.sheet_to_json(workbook.Sheets['Period_Data']);
            excelData.npsData = XLSX.utils.sheet_to_json(workbook.Sheets['NPS_Data']);

            console.log('📊 Datos cargados para análisis de tendencias');

            // Guardar en localStorage para compartir entre páginas
            saveToLocalStorage();
            window.isDemoData = false;

            renderTrendsDashboard();
            showMessage('✅ Previsiones calculadas correctamente y sincronizadas', 'success');

        } catch (error) {
            console.error('Error:', error);
            showMessage('❌ Error al cargar el archivo: ' + error.message, 'error');
        }
    };

    reader.readAsArrayBuffer(file);
}

/* ===== CLEAR ALL DATA ===== */
function clearAllData() {
    // Limpiar datos de Excel
    excelData.accounts = [];
    excelData.periodData = [];
    excelData.npsData = [];
    
    // Limpiar previsiones calculadas
    forecastData.mrr = [];
    forecastData.arr = [];
    forecastData.churn = [];
    
    // Destruir gráficos existentes
    if (charts.forecastMRR) {
        charts.forecastMRR.destroy();
        charts.forecastMRR = null;
    }
    if (charts.scenarioComparison) {
        charts.scenarioComparison.destroy();
        charts.scenarioComparison = null;
    }
    
    console.log('🗑️ Datos anteriores eliminados');
}

/* ===== PROCESAMIENTO Y PREDICCIÓN ===== */
function calculateTrends() {
    // Datos históricos por año
    const yearlyData = {};
    
    excelData.periodData.forEach(record => {
        const year = record.Period.split('-')[0];
        
        if (!yearlyData[year]) {
            yearlyData[year] = {
                mrr: [],
                expansion: 0,
                contraction: 0,
                churn: 0,
                clientsStart: 0,
                clientsChurned: 0
            };
        }
        
        yearlyData[year].mrr.push(parseFloat(record.MRR_Starting) || 0);
        yearlyData[year].expansion += parseFloat(record.Expansion_Revenue) || 0;
        yearlyData[year].contraction += parseFloat(record.Contraction_Revenue) || 0;
        yearlyData[year].churn += parseFloat(record.Churned_Revenue) || 0;
        yearlyData[year].clientsStart += parseInt(record.Clients_Start_Period) || 0;
        yearlyData[year].clientsChurned += parseInt(record.Clients_Churned) || 0;
    });
    
    // Calcular métricas anuales
    const years = Object.keys(yearlyData).sort();
    const metrics = years.map(year => {
        const data = yearlyData[year];
        const avgMRR = data.mrr.reduce((a, b) => a + b, 0) / data.mrr.length;
        const starting = data.mrr.reduce((a, b) => a + b, 0);
        const nrr = starting > 0 ? ((starting + data.expansion - data.contraction - data.churn) / starting) * 100 : 100;
        const churnRate = data.clientsStart > 0 ? (data.clientsChurned / data.clientsStart) * 100 : 0;
        
        // NPS del año
        const npsYear = excelData.npsData.filter(n => n.Period.startsWith(year));
        const nps = calculateNPS(npsYear);
        
        return {
            year: parseInt(year),
            mrr: avgMRR,
            arr: avgMRR * 12,
            nrr,
            churnRate,
            nps
        };
    });
    
    return metrics;
}

function calculateNPS(npsRecords) {
    if (npsRecords.length === 0) return 0;
    
    let promoters = 0;
    let detractors = 0;
    
    npsRecords.forEach(record => {
        const score = parseInt(record.NPS_Response);
        if (score >= 9) promoters++;
        else if (score <= 6) detractors++;
    });
    
    const total = npsRecords.length;
    return Math.round(((promoters - detractors) / total) * 100);
}

function predictFuture(historicalMetrics) {
    // Últimos 3 años para tendencia
    const recentYears = historicalMetrics.slice(-3);
    
    // Calcular tasa de crecimiento promedio (CAGR)
    const mrrGrowthRates = [];
    for (let i = 1; i < recentYears.length; i++) {
        const growth = (recentYears[i].mrr - recentYears[i-1].mrr) / recentYears[i-1].mrr;
        mrrGrowthRates.push(growth);
    }
    const avgGrowthRate = mrrGrowthRates.reduce((a, b) => a + b, 0) / mrrGrowthRates.length;
    
    // Proyección MRR 2027
    const currentMRR = recentYears[recentYears.length - 1].mrr;
    const forecastMRR = currentMRR * (1 + avgGrowthRate);
    const forecastARR = forecastMRR * 12;
    
    // Rango de confianza (±15%)
    const mrrMin = forecastMRR * 0.85;
    const mrrMax = forecastMRR * 1.15;
    const arrMin = forecastARR * 0.85;
    const arrMax = forecastARR * 1.15;
    
    // Proyección Churn (promedio últimos 3 años)
    const avgChurn = recentYears.reduce((sum, y) => sum + y.churnRate, 0) / recentYears.length;
    const churnTrend = recentYears[recentYears.length - 1].churnRate < recentYears[0].churnRate ? '↓' : '↑';
    const churnImpact = avgChurn < 10 ? 'Bajo impacto' : avgChurn < 15 ? 'Impacto moderado' : 'Alto impacto';
    
    // Proyección NPS (promedio últimos 3 años con ligera mejora)
    const avgNPS = recentYears.reduce((sum, y) => sum + y.nps, 0) / recentYears.length;
    const forecastNPS = Math.round(avgNPS * 1.05); // Asumimos mejora del 5%
    const npsTrend = forecastNPS > avgNPS ? '↑' : forecastNPS < avgNPS ? '↓' : '↔';
    const npsClass = forecastNPS >= 50 ? 'Excelente' : forecastNPS >= 30 ? 'Bueno' : forecastNPS >= 0 ? 'Regular' : 'Crítico';
    
    // Proyección NRR (promedio últimos 3 años con tendencia)
    const avgNRR = recentYears.reduce((sum, y) => sum + y.nrr, 0) / recentYears.length;
    const nrrTrend = recentYears[recentYears.length - 1].nrr - recentYears[0].nrr;
    const forecastNRR = avgNRR + (nrrTrend / recentYears.length); // Proyectar tendencia
    
    // Confianza basada en volatilidad
    const mrrVolatility = calculateVolatility(recentYears.map(y => y.mrr));
    const confidence = Math.max(65, Math.min(95, 100 - (mrrVolatility * 100)));
    
    return {
        mrr: forecastMRR,
        mrrMin,
        mrrMax,
        arr: forecastARR,
        arrMin,
        arrMax,
        churn: avgChurn,
        churnTrend,
        churnImpact,
        nps: forecastNPS,
        npsTrend,
        npsClass,
        nrr: forecastNRR,
        confidence,
        growthRate: avgGrowthRate
    };
}

function calculateVolatility(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance) / mean; // Coeficiente de variación
}

function calculateScenarios(forecastMRR, avgChurn) {
    return {
        optimistic: {
            mrr: forecastMRR * 1.25, // 25% mejor
            growth: 25,
            churn: avgChurn * 0.7 // -30%
        },
        realistic: {
            mrr: forecastMRR,
            growth: 0,
            churn: avgChurn
        },
        pessimistic: {
            mrr: forecastMRR * 0.85, // 15% peor
            growth: -15,
            churn: avgChurn * 1.5 // +50%
        }
    };
}

function analyzeTrends(metrics) {
    const positive = [];
    const negative = [];
    const stable = [];
    
    // Analizar últimos 3 años (o todos los disponibles si hay menos)
    const recent = metrics.length >= 3 ? metrics.slice(-3) : metrics;
    if (recent.length === 0) return { positive, negative, stable };
    
    const lastYear = recent[recent.length - 1];
    const firstYear = recent[0];
    
    // Tendencia MRR
    const mrrTrend = lastYear.mrr - firstYear.mrr;
    const mrrGrowthPct = (mrrTrend / firstYear.mrr) * 100;
    
    if (mrrTrend > 0) {
        positive.push(`MRR ha crecido ${formatPercentage(mrrGrowthPct)} en los últimos ${recent.length} años`);
    } else if (mrrTrend < 0) {
        negative.push(`MRR ha disminuido ${formatPercentage(Math.abs(mrrGrowthPct))} en los últimos ${recent.length} años`);
    }
    
    // Análisis NRR - tanto tendencia como valor absoluto
    const avgNRR = recent.reduce((sum, y) => sum + y.nrr, 0) / recent.length;
    if (avgNRR >= 105) {
        positive.push(`NRR promedio de ${avgNRR.toFixed(1)}% indica crecimiento orgánico saludable`);
    } else if (avgNRR < 100) {
        negative.push(`NRR promedio de ${avgNRR.toFixed(1)}% indica contracción neta de ingresos`);
    } else {
        stable.push(`NRR promedio de ${avgNRR.toFixed(1)}% muestra estabilidad`);
    }
    
    // Verificar si NRR está en declive
    if (recent.length >= 2) {
        const nrrDecline = lastYear.nrr - firstYear.nrr;
        if (nrrDecline < -3 && !negative.some(t => t.includes('NRR'))) {
            negative.push(`NRR ha caído ${Math.abs(nrrDecline).toFixed(1)} puntos porcentuales - señal de pérdida de valor`);
        }
    }
    
    // Análisis Churn - valor absoluto crítico
    const currentChurn = lastYear.churnRate;
    const churnTrend = lastYear.churnRate - firstYear.churnRate;
    
    if (currentChurn > 15) {
        negative.push(`Churn actual de ${currentChurn.toFixed(1)}% es crítico - supera el benchmark de industria (10%)`);
    } else if (currentChurn > 10) {
        negative.push(`Churn de ${currentChurn.toFixed(1)}% es elevado - requiere programa de retención`);
    } else if (churnTrend < -1) {
        positive.push(`Churn ha disminuido ${Math.abs(churnTrend).toFixed(1)} puntos porcentuales`);
    } else if (churnTrend > 1) {
        negative.push(`Churn ha aumentado ${churnTrend.toFixed(1)} puntos porcentuales`);
    } else {
        stable.push(`Churn se mantiene estable en ~${currentChurn.toFixed(1)}%`);
    }
    
    // Análisis NPS - tanto tendencia como valor absoluto
    const currentNPS = lastYear.nps;
    const npsTrend = lastYear.nps - firstYear.nps;
    
    if (currentNPS < 0) {
        negative.push(`NPS negativo (${currentNPS}) - más detractores que promotores, requiere acción inmediata`);
    } else if (currentNPS < 30) {
        negative.push(`NPS de ${currentNPS} es bajo - satisfacción del cliente comprometida`);
    } else if (npsTrend > 5) {
        positive.push(`NPS ha mejorado ${npsTrend} puntos, indicando mayor satisfacción`);
    } else if (npsTrend < -5) {
        negative.push(`NPS ha disminuido ${Math.abs(npsTrend)} puntos, requiere atención`);
    } else if (currentNPS >= 50) {
        positive.push(`NPS de ${currentNPS} es excelente - base de clientes promotores`);
    } else {
        stable.push(`NPS se mantiene estable en ~${currentNPS}`);
    }
    
    // Análisis de cuentas en riesgo (si hay datos de actualidad)
    if (typeof calculatedMetrics !== 'undefined' && calculatedMetrics.accountMetrics) {
        const atRiskAccounts = calculatedMetrics.accountMetrics.filter(a => a.healthScore < 60);
        const criticalAccounts = calculatedMetrics.accountMetrics.filter(a => a.healthScore < 40);
        
        if (criticalAccounts.length > 0) {
            negative.push(`${criticalAccounts.length} cuenta(s) en estado crítico (Health Score < 40)`);
        }
        if (atRiskAccounts.length > 3) {
            negative.push(`${atRiskAccounts.length} cuentas totales en riesgo - requiere intervención de CS`);
        }
        
        // Revenue at Risk
        if (calculatedMetrics.kpis && calculatedMetrics.kpis.revenueAtRisk > 0) {
            const riskPct = (calculatedMetrics.kpis.revenueAtRisk / calculatedMetrics.kpis.mrr) * 100;
            if (riskPct > 20) {
                negative.push(`${formatCurrency(calculatedMetrics.kpis.revenueAtRisk)} en riesgo (${riskPct.toFixed(0)}% del MRR)`);
            }
        }
    }
    
    // Si no hay datos negativos, agregar mensaje informativo
    if (negative.length === 0) {
        negative.push('No se detectaron áreas críticas - todas las métricas clave están saludables');
    }
    
    return { positive, negative, stable };
}

function generateRecommendations(forecast, trends) {
    const recommendations = [];
    
    // Basado en crecimiento proyectado
    if (forecast.growthRate > 0.1) {
        recommendations.push({
            priority: 'medium',
            title: 'Capitalizar impulso de crecimiento',
            description: 'Con un crecimiento proyectado positivo, invertir en expansión de cuentas existentes mediante upselling y cross-selling.'
        });
    } else if (forecast.growthRate < 0) {
        recommendations.push({
            priority: 'high',
            title: 'Revertir tendencia negativa',
            description: 'Implementar plan de retención agresivo. Revisar product-market fit y valor percibido por clientes.'
        });
    }
    
    // Basado en churn
    if (forecast.churn > 12) {
        recommendations.push({
            priority: 'high',
            title: 'Reducir tasa de churn crítica',
            description: `Churn proyectado de ${forecast.churn.toFixed(1)}% es superior al benchmark. Implementar programa de Customer Success proactivo.`
        });
    } else if (forecast.churn < 8) {
        recommendations.push({
            priority: 'low',
            title: 'Mantener excelencia en retención',
            description: 'Churn bajo es un indicador de salud. Documentar best practices y escalar a nuevos segmentos.'
        });
    }
    
    // Basado en NPS
    if (forecast.nps < 30) {
        recommendations.push({
            priority: 'high',
            title: 'Mejorar satisfacción del cliente',
            description: 'NPS bajo requiere investigación profunda. Realizar entrevistas cualitativas para identificar pain points.'
        });
    } else if (forecast.nps > 50) {
        recommendations.push({
            priority: 'medium',
            title: 'Aprovechar promotores para referrals',
            description: 'Con NPS alto, implementar programa de referidos para acelerar adquisición orgánica.'
        });
    }
    
    // Recomendación de confianza
    if (forecast.confidence < 75) {
        recommendations.push({
            priority: 'medium',
            title: 'Mejorar predictibilidad del negocio',
            description: 'Alta volatilidad en métricas. Implementar contratos multi-año y reducir dependencia de pocas cuentas grandes.'
        });
    }
    
    return recommendations;
}

/* ===== RENDERIZADO ===== */
function renderTrendsDashboard() {
    const metrics = calculateTrends();
    const forecast = predictFuture(metrics);
    const trends = analyzeTrends(metrics);
    const scenarios = calculateScenarios(forecast.mrr, forecast.churn);
    const recommendations = generateRecommendations(forecast, trends);
    
    renderForecasts(forecast);
    renderForecastCharts(metrics, forecast);
    renderTrendsAnalysis(trends);
    renderRecommendations(recommendations);
    renderScenarios(scenarios);
}

function renderForecasts(forecast) {
    document.getElementById('forecastMrr').textContent = formatCurrency(forecast.mrr);
    document.getElementById('forecastMrrConfidence').textContent = forecast.confidence.toFixed(0) + '%';
    document.getElementById('forecastMrrRange').textContent = 
        `${formatCurrency(forecast.mrrMin)} - ${formatCurrency(forecast.mrrMax)}`;
    
    document.getElementById('forecastArr').textContent = formatCurrency(forecast.arr);
    document.getElementById('forecastArrConfidence').textContent = forecast.confidence.toFixed(0) + '%';
    document.getElementById('forecastArrRange').textContent = 
        `${formatCurrency(forecast.arrMin)} - ${formatCurrency(forecast.arrMax)}`;
    
    document.getElementById('forecastChurn').textContent = forecast.churn.toFixed(1) + '%';
    document.getElementById('forecastChurnTrend').textContent = forecast.churnTrend;
    document.getElementById('forecastChurnImpact').textContent = forecast.churnImpact;
    
    document.getElementById('forecastNps').textContent = forecast.nps;
    document.getElementById('forecastNpsTrend').textContent = forecast.npsTrend;
    document.getElementById('forecastNpsClass').textContent = forecast.npsClass;
}

function renderForecastCharts(historicalMetrics, forecast) {
    // Preparar datos
    const years = historicalMetrics.map(m => m.year.toString());
    years.push('2027');
    
    const mrrHistorical = historicalMetrics.map(m => m.mrr);
    const mrrWithForecast = [...mrrHistorical, forecast.mrr];
    
    const nrrHistorical = historicalMetrics.map(m => m.nrr);
    const nrrWithForecast = [...nrrHistorical, forecast.nrr];
    
    const churnHistorical = historicalMetrics.map(m => m.churnRate);
    const churnWithForecast = [...churnHistorical, forecast.churn];
    
    // Destruir charts existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    // MRR Forecast Chart
    charts.mrrForecast = new Chart(document.getElementById('mrrForecastChart'), {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'MRR Histórico',
                    data: [...mrrHistorical, null],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'MRR Proyectado',
                    data: [...Array(mrrHistorical.length).fill(null), forecast.mrr],
                    borderColor: '#f59e0b',
                    borderDash: [10, 5],
                    borderWidth: 3,
                    pointRadius: 7,
                    pointStyle: 'star',
                    pointBackgroundColor: '#f59e0b'
                },
                {
                    label: 'Rango Superior',
                    data: [...Array(mrrHistorical.length).fill(null), forecast.mrrMax],
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                    borderDash: [5, 5],
                    borderWidth: 1,
                    fill: false
                },
                {
                    label: 'Rango Inferior',
                    data: [...Array(mrrHistorical.length).fill(null), forecast.mrrMin],
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                    borderDash: [5, 5],
                    borderWidth: 1,
                    fill: '-1',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: (context) => context.dataset.label + ': ' + (context.parsed.y || 0).toLocaleString('es-ES') + ' €'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                    }
                }
            }
        }
    });
    
    // NRR Forecast
    charts.nrrForecast = new Chart(document.getElementById('nrrForecastChart'), {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'NRR Histórico',
                data: nrrHistorical,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'NRR Proyectado',
                data: [...Array(nrrHistorical.length - 1).fill(null), nrrHistorical[nrrHistorical.length - 1], forecast.nrr],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                borderDash: [10, 5],
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    display: true,
                    position: 'top'
                } 
            },
            scales: {
                y: {
                    min: 90,
                    max: 120,
                    ticks: { callback: (value) => value + '%' }
                }
            }
        }
    });
    
    // Churn Forecast
    charts.churnForecast = new Chart(document.getElementById('churnForecastChart'), {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Churn Histórico',
                    data: [...churnHistorical, null],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Churn Proyectado',
                    data: [...Array(churnHistorical.length).fill(null), forecast.churn],
                    borderColor: '#f59e0b',
                    borderDash: [10, 5],
                    borderWidth: 3,
                    pointRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => value + '%' }
                }
            }
        }
    });
}

function renderTrendsAnalysis(trends) {
    const positiveTrends = document.getElementById('positiveTrends');
    const negativeTrends = document.getElementById('negativeTrends');
    const stableTrends = document.getElementById('stableTrends');
    
    positiveTrends.innerHTML = trends.positive.length > 0 
        ? trends.positive.map(t => `<li>${t}</li>`).join('')
        : '<li>No hay tendencias positivas significativas</li>';
    
    negativeTrends.innerHTML = trends.negative.length > 0
        ? trends.negative.map(t => `<li>${t}</li>`).join('')
        : '<li>No hay áreas de preocupación</li>';
    
    stableTrends.innerHTML = trends.stable.length > 0
        ? trends.stable.map(t => `<li>${t}</li>`).join('')
        : '<li>No hay métricas estables</li>';
}

function renderRecommendations(recommendations) {
    const container = document.getElementById('recommendationsContainer');
    container.innerHTML = '';
    
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="recommendation-card">
                <div class="recommendation-priority low">Información</div>
                <div class="recommendation-title">Sin recomendaciones específicas</div>
                <div class="recommendation-description">Las métricas actuales están dentro de rangos esperados.</div>
            </div>
        `;
        return;
    }
    
    recommendations.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        card.innerHTML = `
            <div class="recommendation-priority ${rec.priority}">${
                rec.priority === 'high' ? 'Alta Prioridad' :
                rec.priority === 'medium' ? 'Prioridad Media' : 'Baja Prioridad'
            }</div>
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-description">${rec.description}</div>
        `;
        container.appendChild(card);
    });
}

function renderScenarios(scenarios) {
    // Optimistic
    document.getElementById('optimisticMrr').textContent = formatCurrency(scenarios.optimistic.mrr);
    document.getElementById('optimisticGrowth').textContent = '+' + scenarios.optimistic.growth + '%';
    document.getElementById('optimisticChurn').textContent = scenarios.optimistic.churn.toFixed(1) + '%';
    
    // Realistic
    document.getElementById('realisticMrr').textContent = formatCurrency(scenarios.realistic.mrr);
    document.getElementById('realisticGrowth').textContent = 
        scenarios.realistic.growth >= 0 ? '+' + scenarios.realistic.growth + '%' : scenarios.realistic.growth + '%';
    document.getElementById('realisticChurn').textContent = scenarios.realistic.churn.toFixed(1) + '%';
    
    // Pessimistic
    document.getElementById('pessimisticMrr').textContent = formatCurrency(scenarios.pessimistic.mrr);
    document.getElementById('pessimisticGrowth').textContent = scenarios.pessimistic.growth + '%';
    document.getElementById('pessimisticChurn').textContent = scenarios.pessimistic.churn.toFixed(1) + '%';
}

/* ===== UTILIDADES ===== */
function saveToLocalStorage() {
    try {
        localStorage.setItem('customerSuccessData', JSON.stringify({
            accounts: excelData.accounts,
            periodData: excelData.periodData,
            npsData: excelData.npsData,
            timestamp: new Date().toISOString()
        }));
        console.log('💾 Datos guardados en localStorage');
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('customerSuccessData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            excelData.accounts = parsed.accounts;
            excelData.periodData = parsed.periodData;
            excelData.npsData = parsed.npsData;
            window.isDemoData = false;
            
            console.log('📂 Datos cargados desde localStorage');
            renderTrendsDashboard();
            
            const timestamp = new Date(parsed.timestamp);
            showMessage(`✅ Datos cargados automáticamente (${timestamp.toLocaleString()})`, 'success');
        } else if (typeof DEMO_DATA !== 'undefined') {
            excelData.accounts = DEMO_DATA.accounts;
            excelData.periodData = DEMO_DATA.periodData;
            excelData.npsData = DEMO_DATA.npsData;
            window.isDemoData = true;
            console.log('📊 Modo demostración activado');
            renderTrendsDashboard();
            showMessage('📊 Modo DEMO — Carga tu Excel para ver tus datos reales', 'info');
        }
    } catch (error) {
        console.error('Error al cargar desde localStorage:', error);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatPercentage(value) {
    return value.toFixed(1) + '%';
}

function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message-banner ${type}`;
    messageEl.style.display = 'block';

    if (type !== 'loading') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}
