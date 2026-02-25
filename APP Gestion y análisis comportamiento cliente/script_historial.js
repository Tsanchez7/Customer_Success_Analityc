// ===== SCRIPT PARA PÁGINA DE HISTORIAL (10 AÑOS) =====

/* VARIABLES GLOBALES */
let excelData = {
    accounts: [],
    periodData: [],
    npsData: []
};

let charts = {
    mrr: null,
    nrr: null,
    churn: null,
    nps: null,
    arr: null
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
    
    // Si ya hay datos cargados, pedir confirmación
    if (excelData.accounts.length > 0) {
        const confirmed = confirm(
            '⚠️ Ya hay un archivo cargado.\n\n' +
            '¿Desea cargar un nuevo archivo?\n' +
            'Los datos actuales se reemplazarán completamente.'
        );
        
        if (!confirmed) {
            // Limpiar el input de archivo
            event.target.value = '';
            return;
        }
        
        // Limpiar todos los datos existentes
        clearAllData();
    }

    showMessage('Cargando archivo...', 'loading');
    document.getElementById('fileName').textContent = file.name;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Leer hojas
            excelData.accounts = XLSX.utils.sheet_to_json(workbook.Sheets['Accounts']);
            excelData.periodData = XLSX.utils.sheet_to_json(workbook.Sheets['Period_Data']);
            excelData.npsData = XLSX.utils.sheet_to_json(workbook.Sheets['NPS_Data']);

            console.log('📊 Datos cargados:', {
                accounts: excelData.accounts.length,
                periodData: excelData.periodData.length,
                npsData: excelData.npsData.length
            });

            // Guardar en localStorage para compartir entre páginas
            saveToLocalStorage();

            // Renderizar dashboards
            renderHistoricalDashboard();
            showMessage('✅ Datos cargados correctamente y sincronizados', 'success');

        } catch (error) {
            console.error('Error al procesar Excel:', error);
            showMessage('❌ Error al cargar el archivo: ' + error.message, 'error');
        }
    };

    reader.onerror = function() {
        showMessage('❌ Error al leer el archivo', 'error');
    };

    reader.readAsArrayBuffer(file);
}

/* ===== CLEAR ALL DATA ===== */
function clearAllData() {
    // Limpiar datos de Excel
    excelData.accounts = [];
    excelData.periodData = [];
    excelData.npsData = [];
    
    // Destruir gráficos existentes
    if (charts.historicalMRR) {
        charts.historicalMRR.destroy();
        charts.historicalMRR = null;
    }
    if (charts.historicalNRR) {
        charts.historicalNRR.destroy();
        charts.historicalNRR = null;
    }
    if (charts.historicalChurn) {
        charts.historicalChurn.destroy();
        charts.historicalChurn = null;
    }
    if (charts.historicalNPS) {
        charts.historicalNPS.destroy();
        charts.historicalNPS = null;
    }
    
    console.log('🗑️ Datos anteriores eliminados');
}

/* ===== PROCESAMIENTO DE DATOS ===== */
function processHistoricalData() {
    // Agrupar por año
    const dataByYear = {};
    
    excelData.periodData.forEach(record => {
        const year = record.Period.split('-')[0];
        
        if (!dataByYear[year]) {
            dataByYear[year] = {
                periods: [],
                totalMRR: 0,
                totalExpansion: 0,
                totalContraction: 0,
                totalChurn: 0,
                totalClientsStart: 0,
                totalClientsChurned: 0,
                totalEligibleRenewal: 0,
                totalRenewed: 0
            };
        }
        
        dataByYear[year].periods.push(record);
        dataByYear[year].totalMRR += parseFloat(record.MRR_Starting) || 0;
        dataByYear[year].totalExpansion += parseFloat(record.Expansion_Revenue) || 0;
        dataByYear[year].totalContraction += parseFloat(record.Contraction_Revenue) || 0;
        dataByYear[year].totalChurn += parseFloat(record.Churned_Revenue) || 0;
        dataByYear[year].totalClientsStart += parseInt(record.Clients_Start_Period) || 0;
        dataByYear[year].totalClientsChurned += parseInt(record.Clients_Churned) || 0;
        dataByYear[year].totalEligibleRenewal += parseInt(record.Clients_Eligible_for_Renewal) || 0;
        dataByYear[year].totalRenewed += parseInt(record.Clients_Renewed) || 0;
    });

    // Calcular métricas por año
    const years = Object.keys(dataByYear).sort();
    const metrics = years.map(year => {
        const data = dataByYear[year];
        const numQuarters = data.periods.length;
        
        // MRR Promedio del año
        const avgMRR = data.totalMRR / numQuarters;
        
        // ARR
        const arr = avgMRR * 12;
        
        // NRR
        const nrr = data.totalMRR > 0 ? 
            ((data.totalMRR + data.totalExpansion - data.totalContraction - data.totalChurn) / data.totalMRR) * 100 : 100;
        
        // Churn Rate
        const churnRate = data.totalClientsStart > 0 ?
            (data.totalClientsChurned / data.totalClientsStart) * 100 : 0;
        
        // NPS Promedio del año
        const npsForYear = excelData.npsData.filter(n => n.Period.startsWith(year));
        const avgNPS = calculateNPS(npsForYear);
        
        // Número de clientes únicos
        const uniqueAccounts = [...new Set(data.periods.map(p => p.Account_ID))].length;
        
        return {
            year,
            avgMRR: Math.round(avgMRR),
            arr: Math.round(arr),
            nrr: Math.round(nrr * 10) / 10,
            churnRate: Math.round(churnRate * 10) / 10,
            nps: avgNPS,
            clients: uniqueAccounts
        };
    });

    return { years, metrics, dataByYear };
}

function calculateNPS(npsRecords) {
    if (npsRecords.length === 0) return 0;
    
    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    
    npsRecords.forEach(record => {
        const score = parseInt(record.NPS_Response);
        if (score >= 9) promoters++;
        else if (score >= 7) passives++;
        else detractors++;
    });
    
    const total = promoters + passives + detractors;
    const nps = ((promoters - detractors) / total) * 100;
    return Math.round(nps);
}

/* ===== RENDERIZADO ===== */
function renderHistoricalDashboard() {
    const { years, metrics, dataByYear } = processHistoricalData();
    
    // Renderizar comparativa
    renderComparison(metrics);
    
    // Renderizar gráficos
    renderHistoricalCharts(years, metrics);
    
    // Renderizar tabla anual
    renderYearlyTable(metrics);
    
    // Renderizar hitos
    renderMilestones(metrics);
}

function renderComparison(metrics) {
    if (metrics.length < 2) return;
    
    const initial = metrics[0];
    const final = metrics[metrics.length - 1];
    
    const growth = ((final.avgMRR - initial.avgMRR) / initial.avgMRR) * 100;
    
    // CAGR: (Valor Final / Valor Inicial)^(1/n) - 1
    const years = metrics.length - 1;
    const cagr = (Math.pow(final.avgMRR / initial.avgMRR, 1 / years) - 1) * 100;
    
    document.getElementById('mrrInitial').textContent = formatCurrency(initial.avgMRR);
    document.getElementById('mrrFinal').textContent = formatCurrency(final.avgMRR);
    document.getElementById('mrrGrowth').textContent = formatPercentage(growth);
    document.getElementById('cagrValue').textContent = formatPercentage(cagr);
}

function renderHistoricalCharts(years, metrics) {
    const yearLabels = years.map(y => y);
    const mrrData = metrics.map(m => m.avgMRR);
    const nrrData = metrics.map(m => m.nrr);
    const churnData = metrics.map(m => m.churnRate);
    const npsData = metrics.map(m => m.nps);
    const arrData = metrics.map(m => m.arr);
    
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    // MRR Chart
    charts.mrr = new Chart(document.getElementById('mrrHistoricalChart'), {
        type: 'line',
        data: {
            labels: yearLabels,
            datasets: [{
                label: 'MRR',
                data: mrrData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => 'MRR: $' + context.parsed.y.toLocaleString()
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
    
    // NRR Chart
    charts.nrr = new Chart(document.getElementById('nrrHistoricalChart'), {
        type: 'line',
        data: {
            labels: yearLabels,
            datasets: [{
                label: 'NRR (%)',
                data: nrrData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => 'NRR: ' + context.parsed.y.toFixed(1) + '%'
                    }
                }
            },
            scales: {
                y: {
                    min: 90,
                    max: 120,
                    ticks: {
                        callback: (value) => value + '%'
                    }
                }
            }
        }
    });
    
    // Churn Chart
    charts.churn = new Chart(document.getElementById('churnHistoricalChart'), {
        type: 'line',
        data: {
            labels: yearLabels,
            datasets: [{
                label: 'Churn Rate (%)',
                data: churnData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => 'Churn: ' + context.parsed.y.toFixed(1) + '%'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => value + '%'
                    }
                }
            }
        }
    });
    
    // NPS Chart
    charts.nps = new Chart(document.getElementById('npsHistoricalChart'), {
        type: 'line',
        data: {
            labels: yearLabels,
            datasets: [{
                label: 'NPS',
                data: npsData,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => 'NPS: ' + context.parsed.y
                    }
                }
            },
            scales: {
                y: {
                    min: -20,
                    max: 80
                }
            }
        }
    });
    
    // ARR Chart
    charts.arr = new Chart(document.getElementById('arrHistoricalChart'), {
        type: 'bar',
        data: {
            labels: yearLabels,
            datasets: [{
                label: 'ARR',
                data: arrData,
                backgroundColor: 'rgba(139, 92, 246, 0.7)',
                borderColor: '#8b5cf6',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => 'ARR: $' + context.parsed.y.toLocaleString()
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
}

function renderYearlyTable(metrics) {
    const tbody = document.getElementById('yearlyDataTable');
    tbody.innerHTML = '';
    
    metrics.forEach((m, index) => {
        const row = document.createElement('tr');
        
        // Determinar tendencias comparando con año anterior
        let mrrTrend = '';
        let nrrTrend = '';
        let churnTrend = '';
        let npsTrend = '';
        
        if (index > 0) {
            const prev = metrics[index - 1];
            mrrTrend = m.avgMRR > prev.avgMRR ? '📈' : m.avgMRR < prev.avgMRR ? '📉' : '➡️';
            nrrTrend = m.nrr > prev.nrr ? '📈' : m.nrr < prev.nrr ? '📉' : '➡️';
            churnTrend = m.churnRate < prev.churnRate ? '✅' : m.churnRate > prev.churnRate ? '⚠️' : '➡️';
            npsTrend = m.nps > prev.nps ? '📈' : m.nps < prev.nps ? '📉' : '➡️';
        }
        
        // Estilos condicionales
        const nrrColor = m.nrr >= 110 ? '#10b981' : m.nrr >= 100 ? '#34d399' : m.nrr >= 95 ? '#f59e0b' : '#ef4444';
        const churnColor = m.churnRate < 8 ? '#10b981' : m.churnRate < 12 ? '#f59e0b' : '#ef4444';
        const npsColor = m.nps >= 50 ? '#10b981' : m.nps >= 30 ? '#34d399' : m.nps >= 0 ? '#f59e0b' : '#ef4444';
        
        row.innerHTML = `
            <td style="font-weight: 700; font-size: 1.1rem; color: #1f2937; background: rgba(59, 130, 246, 0.05);">
                ${m.year}
            </td>
            <td style="font-weight: 600; color: #3b82f6; font-size: 1.05rem;">
                ${formatCurrency(m.avgMRR)}
                <span style="font-size: 0.9rem; margin-left: 4px;">${mrrTrend}</span>
            </td>
            <td style="font-weight: 600; color: #6366f1;">
                ${formatCurrency(m.arr)}
            </td>
            <td style="color: ${nrrColor}; font-weight: 700; font-size: 1.05rem;">
                ${m.nrr.toFixed(1)}%
                <span style="font-size: 0.9rem; margin-left: 4px;">${nrrTrend}</span>
                ${m.nrr >= 100 ? '<br><small style="color: #10b981; font-weight: 500;">Crecimiento neto</small>' : 
                  '<small style="color: #ef4444; font-weight: 500;">Contracción neta</small>'}
            </td>
            <td style="color: ${churnColor}; font-weight: 700; font-size: 1.05rem;">
                ${m.churnRate.toFixed(1)}%
                <span style="font-size: 0.9rem; margin-left: 4px;">${churnTrend}</span>
                ${m.churnRate < 10 ? '<br><small style="color: #10b981;">Excelente</small>' : 
                  m.churnRate < 15 ? '<br><small style="color: #f59e0b;">Aceptable</small>' : 
                  '<br><small style="color: #ef4444;">Crítico</small>'}
            </td>
            <td style="color: ${npsColor}; font-weight: 700; font-size: 1.05rem;">
                ${m.nps}
                <span style="font-size: 0.9rem; margin-left: 4px;">${npsTrend}</span>
                ${m.nps >= 50 ? '<br><small style="color: #10b981;">Promotores</small>' : 
                  m.nps >= 0 ? '<br><small style="color: #f59e0b;">Pasivos</small>' : 
                  '<br><small style="color: #ef4444;">Detractores</small>'}
            </td>
            <td style="font-weight: 600; font-size: 1rem; text-align: center;">
                ${m.clients} 
                <span style="font-size: 0.8rem; color: #6b7280;">cuentas</span>
            </td>
        `;
        
        // Añadir hover effect
        row.style.transition = 'all 0.2s ease';
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = '#f9fafb';
            row.style.transform = 'scale(1.01)';
            row.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
            row.style.transform = '';
            row.style.boxShadow = '';
        });
        
        tbody.appendChild(row);
    });
}

function renderMilestones(metrics) {
    const container = document.getElementById('milestonesContainer');
    container.innerHTML = '';
    
    const milestones = [];
    
    // Mejor año MRR
    const bestMRR = metrics.reduce((max, m) => m.avgMRR > max.avgMRR ? m : max);
    milestones.push({
        icon: '🏆',
        title: `Mejor MRR: ${bestMRR.year}`,
        description: `Alcanzamos ${formatCurrency(bestMRR.avgMRR)} en MRR promedio`
    });
    
    // Mejor NRR
    const bestNRR = metrics.reduce((max, m) => m.nrr > max.nrr ? m : max);
    milestones.push({
        icon: '📈',
        title: `Mejor NRR: ${bestNRR.year}`,
        description: `Récord de retención con ${bestNRR.nrr.toFixed(1)}%`
    });
    
    // Mejor NPS
    const bestNPS = metrics.reduce((max, m) => m.nps > max.nps ? m : max);
    milestones.push({
        icon: '⭐',
        title: `Mejor NPS: ${bestNPS.year}`,
        description: `Máxima satisfacción con NPS de ${bestNPS.nps}`
    });
    
    // Menor Churn
    const lowestChurn = metrics.reduce((min, m) => m.churnRate < min.churnRate ? m : min);
    milestones.push({
        icon: '🛡️',
        title: `Menor Churn: ${lowestChurn.year}`,
        description: `Mejor retención con solo ${lowestChurn.churnRate.toFixed(1)}% de churn`
    });
    
    milestones.forEach(milestone => {
        const card = document.createElement('div');
        card.className = 'milestone-card';
        card.innerHTML = `
            <div class="milestone-icon">${milestone.icon}</div>
            <div class="milestone-title">${milestone.title}</div>
            <div class="milestone-description">${milestone.description}</div>
        `;
        container.appendChild(card);
    });
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
            
            console.log('📂 Datos cargados desde localStorage');
            renderHistoricalDashboard();
            
            const timestamp = new Date(parsed.timestamp);
            showMessage(`✅ Datos cargados automáticamente (${timestamp.toLocaleString()})`, 'success');
        }
    } catch (error) {
        console.error('Error al cargar desde localStorage:', error);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
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
