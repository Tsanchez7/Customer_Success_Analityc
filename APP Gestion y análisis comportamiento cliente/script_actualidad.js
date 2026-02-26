// ===== SCRIPT PARA PÁGINA DE ACTUALIDAD (2026) =====

/* VARIABLES GLOBALES */
let excelData = {
    accounts: [],
    periodData: [],
    npsData: []
};

let calculatedMetrics = {
    kpis: {},
    accountMetrics: []
};

let charts = {
    mrrQuarterly: null,
    nrrQuarterly: null
};

/* ===== EVENT LISTENERS ===== */
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('excelFile');
    fileInput.addEventListener('change', handleFileUpload);
    
    // Inicializar sistema de ayuda y tooltips
    if (typeof initHelpSystem === 'function') {
        initHelpSystem();
    }
    
    // Intentar cargar datos guardados al iniciar
    loadFromLocalStorage();
});

/* ===== GENERATE SAMPLE NPS DATA ===== */
function generateSampleNPSData() {
    const sampleNPS = [];
    const periods = ['2025-01', '2025-02', '2025-03', '2026-01', '2026-02', '2026-03'];
    
    // Generar NPS para cada cuenta existente
    excelData.accounts.forEach(account => {
        periods.forEach(period => {
            // Generar respuestas NPS más realistas basadas en el health score si existe
            let baseScore = 7; // Score medio por defecto
            
            // Si la cuenta tiene datos, ajustar el score base
            if (account.Product_Usage_Percentage) {
                const usage = parseFloat(account.Product_Usage_Percentage) || 50;
                if (usage > 70) baseScore = 8;
                else if (usage < 40) baseScore = 5;
            }
            
            // Añadir variación aleatoria de -2 a +2
            const variation = Math.floor(Math.random() * 5) - 2;
            let npsScore = baseScore + variation;
            
            // Asegurar que está en rango 0-10
            npsScore = Math.max(0, Math.min(10, npsScore));
            
            sampleNPS.push({
                Account_ID: account.Account_ID,
                Period: period,
                NPS_Response: npsScore
            });
        });
    });
    
    return sampleNPS;
}

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
            
            // Generar datos de NPS de ejemplo si están vacíos
            if (!excelData.npsData || excelData.npsData.length === 0) {
                excelData.npsData = generateSampleNPSData();
                console.log('📊 Datos de NPS generados automáticamente');
            }

            console.log('📊 Datos cargados');

            // Guardar en localStorage para compartir entre páginas
            saveToLocalStorage();
            window.isDemoData = false;

            calculateKPIs();
            renderDashboard();
            showMessage('✅ Datos cargados correctamente y sincronizados', 'success');

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
    
    // Limpiar métricas calculadas
    calculatedMetrics.kpis = {};
    calculatedMetrics.accountMetrics = [];
    
    // Destruir gráficos existentes
    if (charts.mrrQuarterly) {
        charts.mrrQuarterly.destroy();
        charts.mrrQuarterly = null;
    }
    if (charts.nrrQuarterly) {
        charts.nrrQuarterly.destroy();
        charts.nrrQuarterly = null;
    }
    
    console.log('🗑️ Datos anteriores eliminados');
}

/* ===== CÁLCULO DE KPIs ===== */
function calculateKPIs() {
    // Limpiar métricas de cuentas anteriores para evitar acumulación
    calculatedMetrics.accountMetrics = [];
    
    // Filtrar datos de 2026 y 2025
    const data2026 = excelData.periodData.filter(p => p.Period.startsWith('2026'));
    const data2025 = excelData.periodData.filter(p => p.Period.startsWith('2025'));
    
    // MRR Actual
    const mrrCurrent = data2026.reduce((sum, p) => sum + (parseFloat(p.MRR_Starting) || 0), 0) / data2026.length;
    const mrr2025 = data2025.reduce((sum, p) => sum + (parseFloat(p.MRR_Starting) || 0), 0) / data2025.length;
    const mrrChange = ((mrrCurrent - mrr2025) / mrr2025) * 100;
    
    // ARR
    const arrCurrent = mrrCurrent * 12;
    const arr2025 = mrr2025 * 12;
    const arrChange = ((arrCurrent - arr2025) / arr2025) * 100;
    
    // NRR
    const totalStarting = data2026.reduce((sum, p) => sum + (parseFloat(p.MRR_Starting) || 0), 0);
    const totalExpansion = data2026.reduce((sum, p) => sum + (parseFloat(p.Expansion_Revenue) || 0), 0);
    const totalContraction = data2026.reduce((sum, p) => sum + (parseFloat(p.Contraction_Revenue) || 0), 0);
    const totalChurned = data2026.reduce((sum, p) => sum + (parseFloat(p.Churned_Revenue) || 0), 0);
    const nrr = ((totalStarting + totalExpansion - totalContraction - totalChurned) / totalStarting) * 100;
    
    const totalStarting2025 = data2025.reduce((sum, p) => sum + (parseFloat(p.MRR_Starting) || 0), 0);
    const totalExpansion2025 = data2025.reduce((sum, p) => sum + (parseFloat(p.Expansion_Revenue) || 0), 0);
    const totalContraction2025 = data2025.reduce((sum, p) => sum + (parseFloat(p.Contraction_Revenue) || 0), 0);
    const totalChurned2025 = data2025.reduce((sum, p) => sum + (parseFloat(p.Churned_Revenue) || 0), 0);
    const nrr2025 = ((totalStarting2025 + totalExpansion2025 - totalContraction2025 - totalChurned2025) / totalStarting2025) * 100;
    const nrrChange = nrr - nrr2025;
    
    // Churn
    const totalClientsStart = data2026.reduce((sum, p) => sum + (parseInt(p.Clients_Start_Period) || 0), 0);
    const totalClientsChurned = data2026.reduce((sum, p) => sum + (parseInt(p.Clients_Churned) || 0), 0);
    const churnRate = (totalClientsChurned / totalClientsStart) * 100;
    
    const totalClientsStart2025 = data2025.reduce((sum, p) => sum + (parseInt(p.Clients_Start_Period) || 0), 0);
    const totalClientsChurned2025 = data2025.reduce((sum, p) => sum + (parseInt(p.Clients_Churned) || 0), 0);
    const churnRate2025 = (totalClientsChurned2025 / totalClientsStart2025) * 100;
    const churnChange = ((churnRate - churnRate2025) / churnRate2025) * 100;
    
    // NPS
    const nps2026 = excelData.npsData.filter(n => n.Period.startsWith('2026'));
    const nps2025Data = excelData.npsData.filter(n => n.Period.startsWith('2025'));
    const nps = calculateNPS(nps2026);
    const nps2025 = calculateNPS(nps2025Data);
    const npsChange = nps - nps2025;
    
    // Calcular métricas por cuenta
    excelData.accounts.forEach(account => {
        const accountPeriodData = excelData.periodData.filter(p => p.Account_ID === account.Account_ID);
        const accountNPSData = excelData.npsData.filter(n => n.Account_ID === account.Account_ID);
        
        const healthData = calculateHealthScore(account, accountPeriodData, accountNPSData);
        const riskLevel = getRiskLevel(healthData.score);
        
        calculatedMetrics.accountMetrics.push({
            ...account,
            healthScore: healthData.score,
            healthComponents: healthData.components,
            riskLevel: riskLevel
        });
    });
    
    // Revenue at Risk
    const revenueAtRisk = calculatedMetrics.accountMetrics
        .filter(a => a.healthScore < 50)
        .reduce((sum, a) => sum + (parseFloat(a.MRR_Current) || 0), 0);
    
    calculatedMetrics.kpis = {
        mrr: mrrCurrent,
        mrrChange,
        arr: arrCurrent,
        arrChange,
        nrr: nrr,
        nrrChange,
        churn: churnRate,
        churnChange,
        nps: nps,
        npsChange,
        revenueAtRisk
    };
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

function calculateHealthScore(account, periodData, npsData) {
    const usageScore = (parseFloat(account.Product_Usage_Percentage) || 0) / 100;
    const adoptionScore = (parseFloat(account.Active_Users) || 0) / (parseFloat(account.Total_Licenses) || 1);
    const ticketScore = Math.max(0, 1 - ((parseInt(account.Open_Tickets) || 0) * 0.05));
    
    let npsScore = 0.5;
    let avgNPS = 0;
    if (npsData.length > 0) {
        avgNPS = npsData.reduce((sum, n) => sum + parseInt(n.NPS_Response), 0) / npsData.length;
        npsScore = avgNPS / 10;
    }
    
    const healthScore = (
        usageScore * 0.3 +
        adoptionScore * 0.25 +
        ticketScore * 0.25 +
        npsScore * 0.2
    ) * 100;
    
    return {
        score: Math.round(healthScore),
        components: {
            usage: parseFloat(account.Product_Usage_Percentage) || 0,
            adoption: Math.round(adoptionScore * 100),
            tickets: parseInt(account.Open_Tickets) || 0,
            nps: Math.round(avgNPS),
            activeUsers: parseInt(account.Active_Users) || 0,
            totalLicenses: parseInt(account.Total_Licenses) || 1
        }
    };
}

function getRiskLevel(healthScore) {
    if (healthScore >= 80) return 'excellent';
    if (healthScore >= 60) return 'good';
    if (healthScore >= 40) return 'at-risk';
    return 'critical';
}

/* ===== RENDERIZADO ===== */
function renderDashboard() {
    renderKPIs();
    renderGlobalAnalysis();
    renderRiskLevels();
    renderQuarterlyCharts();
    renderAccountsTable();
}

function renderKPIs() {
    const kpis = calculatedMetrics.kpis;
    
    // MRR
    document.getElementById('mrrValue').textContent = formatCurrency(kpis.mrr);
    const mrrChangeNum = kpis.mrrChange || 0;
    document.getElementById('mrrChange').innerHTML = `
        <span class="change-indicator" style="color: ${mrrChangeNum >= 0 ? '#10b981' : '#ef4444'}">
            ${mrrChangeNum >= 0 ? '↑' : '↓'}
        </span>
        ${Math.abs(mrrChangeNum).toFixed(1)}% vs año anterior
    `;
    
    // ARR
    document.getElementById('arrValue').textContent = formatCurrency(kpis.arr);
    const arrChangeNum = kpis.arrChange || 0;
    document.getElementById('arrChange').innerHTML = `
        <span class="change-indicator" style="color: ${arrChangeNum >= 0 ? '#10b981' : '#ef4444'}">
            ${arrChangeNum >= 0 ? '↑' : '↓'}
        </span>
        ${Math.abs(arrChangeNum).toFixed(1)}% vs año anterior
    `;
    
    // NRR
    document.getElementById('nrrValue').textContent = kpis.nrr.toFixed(1) + '%';
    const nrrChangeNum = kpis.nrrChange || 0;
    document.getElementById('nrrChange').innerHTML = `
        <span class="change-indicator" style="color: ${nrrChangeNum >= 0 ? '#10b981' : '#ef4444'}">
            ${nrrChangeNum >= 0 ? '↑' : '↓'}
        </span>
        ${Math.abs(nrrChangeNum).toFixed(1)} pts vs año anterior
    `;
    
    // Churn
    document.getElementById('churnValue').textContent = kpis.churn.toFixed(1) + '%';
    const churnChangeNum = kpis.churnChange || 0;
    document.getElementById('churnChange').innerHTML = `
        <span class="change-indicator" style="color: ${churnChangeNum <= 0 ? '#10b981' : '#ef4444'}">
            ${churnChangeNum <= 0 ? '↓' : '↑'}
        </span>
        ${Math.abs(churnChangeNum).toFixed(1)}% vs año anterior
    `;
    
    // NPS
    document.getElementById('npsValue').textContent = kpis.nps;
    const npsChangeNum = kpis.npsChange || 0;
    document.getElementById('npsChange').innerHTML = `
        <span class="change-indicator" style="color: ${npsChangeNum >= 0 ? '#10b981' : '#ef4444'}">
            ${npsChangeNum >= 0 ? '↑' : '↓'}
        </span>
        ${Math.abs(npsChangeNum)} pts vs año anterior
    `;
    
    // Revenue at Risk
    document.getElementById('riskValue').textContent = formatCurrency(kpis.revenueAtRisk);
    
    // Agregar lista de cuentas en riesgo con recomendaciones
    const accountsAtRisk = calculatedMetrics.accountMetrics.filter(a => a.healthScore < 50);
    const riskSummaryContainer = document.getElementById('riskAccountsSummary');
    
    if (accountsAtRisk.length > 0) {
        let summaryHtml = '<div class="risk-summary-list">';
        accountsAtRisk.forEach(account => {
            const reasons = getRiskReasons(account);
            const mainReason = reasons[0]; // Tomar la razón más importante
            let actionText = '';
            
            if (account.healthScore < 40) {
                actionText = '🔴 Reunión urgente + plan de rescate';
            } else {
                actionText = '⚠️ Check-in proactivo + revisión';
            }
            
            summaryHtml += `
                <div class="risk-summary-item">
                    <div class="risk-summary-name">${account.Account_Name}</div>
                    <div class="risk-summary-action">${actionText}</div>
                </div>
            `;
        });
        summaryHtml += '</div>';
        riskSummaryContainer.innerHTML = summaryHtml;
    } else {
        riskSummaryContainer.innerHTML = '<div class="no-risk">✅ Sin cuentas en riesgo</div>';
    }
}

function renderGlobalAnalysis() {
    const kpis = calculatedMetrics.kpis;
    const accounts = calculatedMetrics.accountMetrics;
    
    // ===== RESUMEN EJECUTIVO =====
    const mrrClass = kpis.mrrChange >= 0 ? 'positive' : 'negative';
    const nrrClass = kpis.nrr >= 100 ? 'positive' : kpis.nrr >= 95 ? 'neutral' : 'negative';
    const churnClass = kpis.churn < 10 ? 'positive' : kpis.churn < 15 ? 'neutral' : 'negative';
    
    const executiveSummary = `
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 0.75rem;">
                💰 MRR: <span class="analysis-metric ${mrrClass}">${formatCurrency(kpis.mrr)}</span> 
                <span style="font-size: 0.9rem;">(${kpis.mrrChange >= 0 ? '+' : ''}${kpis.mrrChange.toFixed(1)}% YoY)</span>
            </li>
            <li style="margin-bottom: 0.75rem;">
                📈 NRR: <span class="analysis-metric ${nrrClass}">${kpis.nrr.toFixed(1)}%</span>
                ${kpis.nrr >= 100 ? '✅ Crecimiento orgánico' : '⚠️ Revisa retención'}
            </li>
            <li style="margin-bottom: 0.75rem;">
                👋 Churn: <span class="analysis-metric ${churnClass}">${kpis.churn.toFixed(1)}%</span>
                ${kpis.churn < 5 ? '🟢 Excelente' : kpis.churn < 10 ? '🟡 Aceptable' : '🔴 Requiere acción'}
            </li>
        </ul>
    `;
    document.getElementById('executiveSummary').innerHTML = executiveSummary;
    
    // ===== MÉTRICAS CLAVE =====
    const criticalAccounts = accounts.filter(a => getRiskLevel(a.healthScore) === 'critical').length;
    const atRiskAccounts = accounts.filter(a => getRiskLevel(a.healthScore) === 'at-risk').length;
    const riskPercent = (kpis.revenueAtRisk / kpis.mrr * 100).toFixed(1);
    const riskClass = riskPercent < 10 ? 'positive' : riskPercent < 20 ? 'neutral' : 'negative';
    const npsClass = kpis.nps > 30 ? 'positive' : kpis.nps > 0 ? 'neutral' : 'negative';
    
    const keyMetrics = `
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 0.75rem;">
                📅 ARR Proyectado: <span class="analysis-metric positive">${formatCurrency(kpis.arr)}</span>
            </li>
            <li style="margin-bottom: 0.75rem;">
                ⭐ NPS: <span class="analysis-metric ${npsClass}">${kpis.nps}</span>
                ${kpis.nps > 50 ? '(Excelente)' : kpis.nps > 30 ? '(Bueno)' : '(Mejorar)'}
            </li>
            <li style="margin-bottom: 0.75rem;">
                🚨 Revenue at Risk: <span class="analysis-metric ${riskClass}">${formatCurrency(kpis.revenueAtRisk)}</span> 
                <span style="font-size: 0.9rem;">(${riskPercent}% del MRR)</span>
            </li>
            <li style="margin-bottom: 0.75rem;">
                ⚠️ Cuentas en Riesgo: <span class="analysis-metric ${criticalAccounts + atRiskAccounts > 0 ? 'negative' : 'positive'}">${criticalAccounts + atRiskAccounts}</span>
                ${criticalAccounts > 0 ? ` (${criticalAccounts} críticas)` : ''}
            </li>
        </ul>
    `;
    document.getElementById('keyMetricsAnalysis').innerHTML = keyMetrics;
    
    // ===== ALERTAS Y RECOMENDACIONES =====
    const alertsList = [];
    
    // Solo las alertas más críticas
    if (kpis.churn > 10) {
        alertsList.push({
            type: 'alert',
            message: `<strong>Churn alto (${kpis.churn.toFixed(1)}%):</strong> Investiga causas y actualiza estrategia de retención.`
        });
    }
    
    if (kpis.nrr < 100) {
        alertsList.push({
            type: 'warning',
            message: `<strong>NRR < 100%:</strong> Enfócate en oportunidades de expansión en cuentas saludables.`
        });
    }
    
    if (criticalAccounts > 0) {
        const criticalMRR = accounts
            .filter(a => getRiskLevel(a.healthScore) === 'critical')
            .reduce((sum, a) => sum + (parseFloat(a.MRR_Current) || 0), 0);
        alertsList.push({
            type: 'alert',
            message: `<strong>${criticalAccounts} cuentas críticas:</strong> ${formatCurrency(criticalMRR)} en riesgo inminente de churn.`
        });
    }
    
    if (riskPercent > 15) {
        alertsList.push({
            type: 'alert',
            message: `<strong>Revenue at Risk elevado:</strong> Asigna recursos de CS urgentemente.`
        });
    }
    
    // Alertas positivas
    if (kpis.nrr > 110 && kpis.churn < 5) {
        alertsList.push({
            type: 'success',
            message: `<strong>🎉 Excelente salud del negocio:</strong> NRR ${kpis.nrr.toFixed(1)}% y Churn ${kpis.churn.toFixed(1)}%. Continúa con la estrategia actual.`
        });
    }
    
    let alerts = '<div>';
    if (alertsList.length > 0) {
        alertsList.forEach(alert => {
            alerts += `<div class="alert-item ${alert.type}">${alert.message}</div>`;
        });
    } else {
        alerts += '<div class="alert-item info">✅ Sin alertas críticas. Métricas dentro de rangos saludables.</div>';
    }
    alerts += '</div>';
    
    document.getElementById('alertsRecommendations').innerHTML = alerts;
}

function renderRiskLevels() {
    const riskGroups = {
        excellent: [],
        good: [],
        'at-risk': [],
        critical: []
    };
    
    let criticalRevenue = 0;
    let atRiskRevenue = 0;
    let healthyRevenue = 0;
    
    // Guardar objetos completos de cuentas para detalle posterior
    const accountsAtRisk = [];
    const accountsCritical = [];
    
    calculatedMetrics.accountMetrics.forEach(account => {
        const mrr = parseFloat(account.MRR_Current) || 0;
        
        if (account.riskLevel === 'excellent') {
            riskGroups.excellent.push(account.Account_Name);
            healthyRevenue += mrr;
        } else if (account.riskLevel === 'good') {
            riskGroups.good.push(account.Account_Name);
            healthyRevenue += mrr;
        } else if (account.riskLevel === 'at-risk') {
            riskGroups['at-risk'].push(account.Account_Name);
            accountsAtRisk.push(account);
            atRiskRevenue += mrr;
        } else {
            riskGroups.critical.push(account.Account_Name);
            accountsCritical.push(account);
            criticalRevenue += mrr;
        }
    });
    
    document.getElementById('excellentCount').textContent = riskGroups.excellent.length;
    document.getElementById('excellentAccounts').textContent = 
        riskGroups.excellent.length > 0 ? riskGroups.excellent.join(', ') : 'Ninguna';
    
    document.getElementById('goodCount').textContent = riskGroups.good.length;
    document.getElementById('goodAccounts').textContent = 
        riskGroups.good.length > 0 ? riskGroups.good.join(', ') : 'Ninguna';
    
    document.getElementById('atRiskCount').textContent = riskGroups['at-risk'].length;
    document.getElementById('atRiskAccounts').textContent = 
        riskGroups['at-risk'].length > 0 ? riskGroups['at-risk'].join(', ') : 'Ninguna';
    
    document.getElementById('criticalCount').textContent = riskGroups.critical.length;
    document.getElementById('criticalAccounts').textContent = 
        riskGroups.critical.length > 0 ? riskGroups.critical.join(', ') : 'Ninguna';
    
    const totalRevenue = criticalRevenue + atRiskRevenue + healthyRevenue;
    const criticalPerc = totalRevenue > 0 ? (criticalRevenue / totalRevenue) * 100 : 0;
    const atRiskPerc = totalRevenue > 0 ? (atRiskRevenue / totalRevenue) * 100 : 0;
    const healthyPerc = totalRevenue > 0 ? (healthyRevenue / totalRevenue) * 100 : 0;
    
    // Actualizar valores
    document.getElementById('criticalRevenue').textContent = formatCurrency(criticalRevenue);
    document.getElementById('atRiskRevenue').textContent = formatCurrency(atRiskRevenue);
    document.getElementById('healthyRevenue').textContent = formatCurrency(healthyRevenue);
    
    // Actualizar listas de cuentas con metadatos
    const criticalList = document.getElementById('criticalAccountsList');
    if (riskGroups.critical.length > 0) {
        criticalList.textContent = `${riskGroups.critical.length} cuenta${riskGroups.critical.length !== 1 ? 's' : ''} (${criticalPerc.toFixed(1)}%): ${riskGroups.critical.join(', ')}`;
    } else {
        criticalList.textContent = '';
    }
    
    const atRiskList = document.getElementById('atRiskAccountsList');
    if (riskGroups['at-risk'].length > 0) {
        atRiskList.textContent = `${riskGroups['at-risk'].length} cuenta${riskGroups['at-risk'].length !== 1 ? 's' : ''} (${atRiskPerc.toFixed(1)}%): ${riskGroups['at-risk'].join(', ')}`;
    } else {
        atRiskList.textContent = '';
    }
    
    const healthyCount = riskGroups.excellent.length + riskGroups.good.length;
    const healthyAccounts = [...riskGroups.excellent, ...riskGroups.good];
    const healthyList = document.getElementById('healthyAccountsList');
    if (healthyAccounts.length > 0) {
        healthyList.textContent = `${healthyCount} cuenta${healthyCount !== 1 ? 's' : ''} (${healthyPerc.toFixed(1)}%): ${healthyAccounts.join(', ')}`;
    } else {
        healthyList.textContent = '';
    }
    
    setTimeout(() => {
        document.getElementById('criticalBar').style.width = criticalPerc + '%';
        document.getElementById('atRiskBar').style.width = atRiskPerc + '%';
        document.getElementById('healthyBar').style.width = healthyPerc + '%';
    }, 100);
    
    // Renderizar detalle de cuentas en riesgo
    renderAccountsAtRiskDetail(accountsCritical, accountsAtRisk);
}

function getRiskReasons(account) {
    if (!account.healthComponents) return [];
    
    const reasons = [];
    const comp = account.healthComponents;
    
    // Analizar uso del producto (crítico < 50%, warning < 70%)
    if (comp.usage < 50) {
        reasons.push({
            icon: '🔴',
            type: 'critical',
            label: 'Uso Crítico',
            value: `${comp.usage}%`,
            detail: 'Producto subutilizado'
        });
    } else if (comp.usage < 70) {
        reasons.push({
            icon: '⚠️',
            type: 'warning',
            label: 'Uso Bajo',
            value: `${comp.usage}%`,
            detail: 'Requiere capacitación'
        });
    }
    
    // Analizar adopción (crítico < 60%, warning < 80%)
    if (comp.adoption < 60) {
        reasons.push({
            icon: '🔴',
            type: 'critical',
            label: 'Adopción Crítica',
            value: `${comp.adoption}% (${comp.activeUsers}/${comp.totalLicenses})`,
            detail: 'Muchas licencias sin usar'
        });
    } else if (comp.adoption < 80) {
        reasons.push({
            icon: '⚠️',
            type: 'warning',
            label: 'Adopción Baja',
            value: `${comp.adoption}% (${comp.activeUsers}/${comp.totalLicenses})`,
            detail: 'Oportunidad de expansión'
        });
    }
    
    // Analizar tickets de soporte (crítico > 5, warning > 3)
    if (comp.tickets > 5) {
        reasons.push({
            icon: '🔴',
            type: 'critical',
            label: 'Soporte Intensivo',
            value: `${comp.tickets} tickets abiertos`,
            detail: 'Problemas técnicos recurrentes'
        });
    } else if (comp.tickets > 3) {
        reasons.push({
            icon: '⚠️',
            type: 'warning',
            label: 'Tickets Elevados',
            value: `${comp.tickets} tickets abiertos`,
            detail: 'Requiere seguimiento'
        });
    }
    
    // Analizar NPS (crítico < 0, warning < 30)
    if (comp.nps < 0) {
        reasons.push({
            icon: '🔴',
            type: 'critical',
            label: 'Insatisfacción',
            value: `NPS: ${comp.nps}`,
            detail: 'Cliente descontento'
        });
    } else if (comp.nps < 30) {
        reasons.push({
            icon: '⚠️',
            type: 'warning',
            label: 'NPS Bajo',
            value: `NPS: ${comp.nps}`,
            detail: 'Satisfacción mejorable'
        });
    }
    
    // Si no hay razones específicas pero el Health Score es bajo
    if (reasons.length === 0 && account.healthScore < 50) {
        reasons.push({
            icon: '🟠',
            type: 'warning',
            label: 'Múltiples Factores',
            value: `Health Score: ${account.healthScore}`,
            detail: 'Varios indicadores por debajo del óptimo'
        });
    }
    
    return reasons;
}

function renderAccountsAtRiskDetail(accountsCritical, accountsAtRisk) {
    const container = document.getElementById('accountsAtRiskDetail');
    
    if (accountsCritical.length === 0 && accountsAtRisk.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 1rem; color: #1e293b;">🚨 Cuentas que Requieren Atención Inmediata</h3>';
    html += '<div class="accounts-risk-cards">';
    
    // Primero las críticas
    if (accountsCritical.length > 0) {
        accountsCritical.forEach(account => {
            const mrr = parseFloat(account.MRR_Current) || 0;
            const arr = mrr * 12;
            const reasons = getRiskReasons(account);
            
            html += `
                <div class="account-risk-card critical-card">
                    <div class="account-risk-header">
                        <div class="account-risk-name">
                            <span class="risk-badge critical">🔴 CRÍTICO</span>
                            <strong>${account.Account_Name}</strong>
                        </div>
                        <div class="account-risk-revenue">${formatCurrency(mrr)}/mes</div>
                    </div>
                    <div class="account-risk-metrics">
                        <div class="risk-metric-item">
                            <span class="metric-label">Health Score:</span>
                            <span class="metric-value health-critical">${account.healthScore}</span>
                        </div>
                        <div class="risk-metric-item">
                            <span class="metric-label">ARR:</span>
                            <span class="metric-value">${formatCurrency(arr)}</span>
                        </div>
                        <div class="risk-metric-item">
                            <span class="metric-label">CSM:</span>
                            <span class="metric-value">${account.CSM_Name || 'Sin asignar'}</span>
                        </div>
                    </div>`;
            
            // Añadir motivos de riesgo
            if (reasons.length > 0) {
                html += '<div class="account-risk-reasons">';
                html += '<div class="reasons-title">📊 Motivos de Riesgo:</div>';
                html += '<div class="reasons-list">';
                reasons.forEach(reason => {
                    html += `
                        <div class="reason-item reason-${reason.type}">
                            <span class="reason-icon">${reason.icon}</span>
                            <div class="reason-content">
                                <div class="reason-label">${reason.label}: <strong>${reason.value}</strong></div>
                                <div class="reason-detail">${reason.detail}</div>
                            </div>
                        </div>
                    `;
                });
                html += '</div></div>';
            }
            
            html += `
                    <div class="account-risk-action">
                        <strong>⚡ Acción Urgente:</strong> Reunión ejecutiva + Plan de rescate inmediato
                    </div>
                </div>
            `;
        });
    }
    
    // Luego las en riesgo
    if (accountsAtRisk.length > 0) {
        accountsAtRisk.forEach(account => {
            const mrr = parseFloat(account.MRR_Current) || 0;
            const arr = mrr * 12;
            const reasons = getRiskReasons(account);
            
            html += `
                <div class="account-risk-card atrisk-card">
                    <div class="account-risk-header">
                        <div class="account-risk-name">
                            <span class="risk-badge at-risk">🟠 EN RIESGO</span>
                            <strong>${account.Account_Name}</strong>
                        </div>
                        <div class="account-risk-revenue">${formatCurrency(mrr)}/mes</div>
                    </div>
                    <div class="account-risk-metrics">
                        <div class="risk-metric-item">
                            <span class="metric-label">Health Score:</span>
                            <span class="metric-value health-atrisk">${account.healthScore}</span>
                        </div>
                        <div class="risk-metric-item">
                            <span class="metric-label">ARR:</span>
                            <span class="metric-value">${formatCurrency(arr)}</span>
                        </div>
                        <div class="risk-metric-item">
                            <span class="metric-label">CSM:</span>
                            <span class="metric-value">${account.CSM_Name || 'Sin asignar'}</span>
                        </div>
                    </div>`;
            
            // Añadir motivos de riesgo
            if (reasons.length > 0) {
                html += '<div class="account-risk-reasons">';
                html += '<div class="reasons-title">📊 Motivos de Riesgo:</div>';
                html += '<div class="reasons-list">';
                reasons.forEach(reason => {
                    html += `
                        <div class="reason-item reason-${reason.type}">
                            <span class="reason-icon">${reason.icon}</span>
                            <div class="reason-content">
                                <div class="reason-label">${reason.label}: <strong>${reason.value}</strong></div>
                                <div class="reason-detail">${reason.detail}</div>
                            </div>
                        </div>
                    `;
                });
                html += '</div></div>';
            }
            
            html += `
                    <div class="account-risk-action">
                        <strong>📋 Acción:</strong> Check-in proactivo + Revisión de uso
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderQuarterlyCharts() {
    const data2026 = excelData.periodData.filter(p => p.Period.startsWith('2026'));
    
    // Agrupar por trimestre
    const quarters = ['2026-Q1'];
    const mrrByQuarter = [];
    const nrrByQuarter = [];
    
    quarters.forEach(q => {
        const qData = data2026.filter(p => p.Period === q);
        const mrr = qData.reduce((sum, p) => sum + (parseFloat(p.MRR_Starting) || 0), 0) / qData.length;
        
        const starting = qData.reduce((sum, p) => sum + (parseFloat(p.MRR_Starting) || 0), 0);
        const expansion = qData.reduce((sum, p) => sum + (parseFloat(p.Expansion_Revenue) || 0), 0);
        const contraction = qData.reduce((sum, p) => sum + (parseFloat(p.Contraction_Revenue) || 0), 0);
        const churned = qData.reduce((sum, p) => sum + (parseFloat(p.Churned_Revenue) || 0), 0);
        const nrr = starting > 0 ? ((starting + expansion - contraction - churned) / starting) * 100 : 100;
        
        mrrByQuarter.push(mrr);
        nrrByQuarter.push(nrr);
    });
    
    // Destruir charts existentes
    if (charts.mrrQuarterly) charts.mrrQuarterly.destroy();
    if (charts.nrrQuarterly) charts.nrrQuarterly.destroy();
    
    // MRR Quarterly
    charts.mrrQuarterly = new Chart(document.getElementById('mrrQuarterlyChart'), {
        type: 'bar',
        data: {
            labels: quarters,
            datasets: [{
                label: 'MRR',
                data: mrrByQuarter,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: '#3b82f6',
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
    
    // NRR Quarterly
    charts.nrrQuarterly = new Chart(document.getElementById('nrrQuarterlyChart'), {
        type: 'line',
        data: {
            labels: quarters,
            datasets: [{
                label: 'NRR (%)',
                data: nrrByQuarter,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6
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
}

function renderAccountsTable() {
    const tbody = document.getElementById('accountsTableBody');
    tbody.innerHTML = '';
    
    calculatedMetrics.accountMetrics.forEach(account => {
        const row = document.createElement('tr');
        
        const adoptionRate = ((parseFloat(account.Active_Users) || 0) / (parseFloat(account.Total_Licenses) || 1)) * 100;
        const accountNPS = excelData.npsData
            .filter(n => n.Account_ID === account.Account_ID)
            .reduce((sum, n, _, arr) => sum + parseInt(n.NPS_Response) / arr.length, 0);
        
        const riskLabels = {
            'excellent': '🟢 Excelente',
            'good': '🟡 Bueno',
            'at-risk': '🟠 En Riesgo',
            'critical': '🔴 Crítico'
        };
        
        row.innerHTML = `
            <td style="font-weight: 600;">${account.Account_Name}</td>
            <td>${formatCurrency(account.MRR_Current)}</td>
            <td>${formatCurrency(account.ARR_Current)}</td>
            <td>
                <span style="font-weight: 600; color: ${getHealthScoreColor(account.healthScore)};">
                    ${account.healthScore}
                </span>
            </td>
            <td>${adoptionRate.toFixed(0)}%</td>
            <td>${Math.round(accountNPS)}</td>
            <td><span class="risk-level ${account.riskLevel}">${riskLabels[account.riskLevel]}</span></td>
            <td>${account.CSM_Name}</td>
        `;
        tbody.appendChild(row);
    });
}

function getHealthScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#fb923c';
    return '#ef4444';
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
            
            // Generar datos de NPS de ejemplo si están vacíos
            if (!excelData.npsData || excelData.npsData.length === 0) {
                excelData.npsData = generateSampleNPSData();
                console.log('📊 Datos de NPS generados automáticamente');
                saveToLocalStorage();
            }
            
            console.log('📂 Datos cargados desde localStorage');
            calculateKPIs();
            renderDashboard();
            
            const timestamp = new Date(parsed.timestamp);
            showMessage(`✅ Datos cargados automáticamente (${timestamp.toLocaleString()})`, 'success');
        } else if (typeof DEMO_DATA !== 'undefined') {
            excelData.accounts = DEMO_DATA.accounts;
            excelData.periodData = DEMO_DATA.periodData;
            excelData.npsData = DEMO_DATA.npsData;
            window.isDemoData = true;
            console.log('📊 Modo demostración activado');
            calculateKPIs();
            renderDashboard();
            showMessage('📊 Modo DEMO — Carga tu Excel para ver tus datos reales', 'info');
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
