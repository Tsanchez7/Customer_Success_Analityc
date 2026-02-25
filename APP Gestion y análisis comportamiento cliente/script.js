/* ===== GLOBAL VARIABLES ===== */
let excelData = {
    accounts: [],
    periodData: [],
    npsData: []
};

let calculatedMetrics = {
    kpis: {},
    accountMetrics: []
};

/* ===== INITIALIZATION ===== */
let xlsxReady = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM cargado, inicializando aplicación...');
    
    const fileInput = document.getElementById('fileInput');
    const clearDataBtn = document.getElementById('clearData');
    const uploadBtn = document.getElementById('uploadBtn');

    if (!fileInput) {
        console.error('❌ No se encontró el elemento fileInput');
        return;
    }

    console.log('✓ Elementos del DOM encontrados');
    
    // Event listener para el input de archivo
    fileInput.addEventListener('change', function(e) {
        console.log('📂 Input file change event disparado');
        handleFileUpload(e);
    });
    
    // Event listener para el botón de limpiar
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearData);
    }

    console.log('✓ Event listeners configurados');

    // Deshabilitar botón hasta que XLSX esté listo
    if (uploadBtn) {
        uploadBtn.style.opacity = '0.5';
        uploadBtn.style.cursor = 'wait';
        uploadBtn.title = 'Cargando sistema...';
        uploadBtn.disabled = true;
    }

    // Verificar disponibilidad de XLSX cada 200ms
    checkXLSXAvailability();
});

function checkXLSXAvailability() {
    let attempts = 0;
    const maxAttempts = 30; // 6 segundos máximo
    const uploadBtn = document.getElementById('uploadBtn');
    
    console.log('🔍 Verificando disponibilidad de SheetJS...');
    
    const interval = setInterval(() => {
        attempts++;
        
        if (typeof XLSX !== 'undefined' || window.xlsxLoaded) {
            xlsxReady = true;
            clearInterval(interval);
            console.log('✅ SheetJS listo para usar');
            
            // Habilitar botón
            if (uploadBtn) {
                uploadBtn.style.opacity = '1';
                uploadBtn.style.cursor = 'pointer';
                uploadBtn.title = 'Haz clic para cargar un archivo Excel';
                uploadBtn.disabled = false;
            }
            
            showMessage('✓ Sistema listo - Carga tu archivo Excel', 'success');
        } else if (attempts >= maxAttempts || window.xlsxLoadError) {
            clearInterval(interval);
            console.error('❌ SheetJS no se pudo cargar después de ' + (attempts * 0.2) + ' segundos');
            console.error('Verifica tu conexión a internet y recarga la página (F5)');
            
            // Mantener botón deshabilitado
            if (uploadBtn) {
                uploadBtn.style.opacity = '0.5';
                uploadBtn.style.cursor = 'not-allowed';
                uploadBtn.title = 'Error: No se pudo cargar el sistema. Recarga la página (F5)';
                uploadBtn.disabled = true;
            }
            
            showMessage('⚠️ Error de conexión. Recarga la página (F5) o verifica tu internet', 'error');
        } else if (attempts === 1) {
            showMessage('⏳ Cargando sistema... espera un momento', 'loading');
        } else if (attempts % 10 === 0) {
            console.log(`⏳ Esperando SheetJS... intento ${attempts}/${maxAttempts}`);
        }
    }, 200);
}

/* ===== FILE UPLOAD HANDLER ===== */
function handleFileUpload(event) {
    console.log('🎯 handleFileUpload ejecutado');
    console.log('Event:', event);
    
    const file = event.target.files[0];
    console.log('Archivo:', file);

    if (!file) {
        console.warn('⚠️ No se seleccionó ningún archivo');
        return;
    }

    console.log('📁 Archivo seleccionado:', file.name, '-', (file.size / 1024).toFixed(2), 'KB');
    console.log('Tipo de archivo:', file.type);

    // Verificar si SheetJS está disponible
    console.log('xlsxReady:', xlsxReady);
    console.log('typeof XLSX:', typeof XLSX);
    
    if (!xlsxReady || typeof XLSX === 'undefined') {
        showMessage('⚠️ El sistema aún está cargando... Espera 2 segundos e intenta de nuevo', 'error');
        console.error('❌ XLSX no está disponible aún. xlsxReady:', xlsxReady);
        event.target.value = ''; // Reset input
        
        // Reintentar verificación
        setTimeout(() => {
            checkXLSXAvailability();
        }, 1000);
        return;
    }

    console.log('✅ SheetJS disponible, procesando archivo...');
    showMessage('📊 Leyendo archivo Excel...', 'loading');
    console.log('Iniciando lectura del archivo...');

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            console.log('✓ Archivo leído, procesando datos...');
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });

            console.log('Hojas disponibles:', workbook.SheetNames.join(', '));

            // Read the three sheets
            excelData.accounts = readSheet(workbook, 'Accounts') || [];
            excelData.periodData = readSheet(workbook, 'Period_Data') || [];
            excelData.npsData = readSheet(workbook, 'NPS_Data') || [];

            console.log('Datos cargados:');
            console.log('  - Accounts:', excelData.accounts.length, 'registros');
            console.log('  - Period_Data:', excelData.periodData.length, 'registros');
            console.log('  - NPS_Data:', excelData.npsData.length, 'registros');

            if (excelData.accounts.length === 0) {
                throw new Error('No se encontraron datos en la hoja "Accounts". Verifica que el archivo tenga las hojas: Accounts, Period_Data, NPS_Data');
            }

            // Calculate KPIs
            console.log('Calculando KPIs...');
            calculateKPIs();

            // Render UI
            console.log('Renderizando dashboard...');
            renderDashboard();

            // Show success message
            showMessage('✓ Archivo cargado exitosamente - ' + excelData.accounts.length + ' cuentas encontradas', 'success');

            // Show clear button
            document.getElementById('clearData').style.display = 'inline-flex';

            console.log('✓ Dashboard actualizado correctamente');

        } catch (error) {
            console.error('❌ Error completo:', error);
            showMessage('Error al cargar el archivo: ' + error.message, 'error');
        }
    };

    reader.onerror = function(error) {
        console.error('❌ Error al leer el archivo:', error);
        showMessage('Error al leer el archivo. Verifica que sea un archivo Excel válido (.xlsx)', 'error');
    };

    reader.readAsArrayBuffer(file);
}

/* ===== SHEET READER ===== */
function readSheet(workbook, sheetName) {
    try {
        if (!workbook.SheetNames.includes(sheetName)) {
            console.warn(`Advertencia: La hoja "${sheetName}" no se encontró`);
            return [];
        }

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        return data;
    } catch (error) {
        console.error(`Error al leer la hoja ${sheetName}:`, error);
        return [];
    }
}

/* ===== KPI CALCULATIONS ===== */
function calculateKPIs() {
    // Calculate global KPIs
    const mrr = calculateMRR();
    const arr = calculateARR(mrr);
    const nrr = calculateNRR();
    const churn = calculateChurnRate();
    const nps = calculateNPS();
    const revenueAtRisk = calculateRevenueAtRisk();
    const adoptionRate = calculateAdoptionRate();

    calculatedMetrics.kpis = {
        mrr: mrr,
        arr: arr,
        nrr: nrr,
        churn: churn,
        nps: nps,
        revenueAtRisk: revenueAtRisk,
        adoptionRate: adoptionRate
    };

    // Calculate per-account metrics
    calculatedMetrics.accountMetrics = excelData.accounts.map(account => {
        const accountPeriodData = excelData.periodData.filter(p => p.Account_ID === account.Account_ID);
        const accountNPSData = excelData.npsData.filter(n => n.Account_ID === account.Account_ID);

        const healthScore = calculateHealthScore(account, accountPeriodData, accountNPSData);
        const adoptionRateAccount = calculateAdoptionRateAccount(account);
        const renewalRate = calculateRenewalRateAccount(accountPeriodData);

        return {
            ...account,
            healthScore: healthScore,
            adoptionRate: adoptionRateAccount,
            renewalRate: renewalRate,
            riskLevel: getRiskLevel(healthScore)
        };
    });
}

/* ===== KPI CALCULATION FUNCTIONS ===== */

function calculateMRR() {
    return excelData.accounts.reduce((sum, account) => {
        return sum + (parseFloat(account.MRR_Current) || 0);
    }, 0);
}

function calculateARR(mrr) {
    return mrr * 12;
}

function calculateNRR() {
    if (excelData.periodData.length === 0) {
        return 0;
    }

    let totalMRRStarting = 0;
    let totalExpansion = 0;
    let totalContraction = 0;
    let totalChurned = 0;

    excelData.periodData.forEach(period => {
        totalMRRStarting += parseFloat(period.MRR_Starting) || 0;
        totalExpansion += parseFloat(period.Expansion_Revenue) || 0;
        totalContraction += parseFloat(period.Contraction_Revenue) || 0;
        totalChurned += parseFloat(period.Churned_Revenue) || 0;
    });

    if (totalMRRStarting === 0) {
        return 0;
    }

    const nrr = ((totalMRRStarting + totalExpansion - totalContraction - totalChurned) / totalMRRStarting) * 100;
    return Math.round(nrr * 100) / 100;
}

function calculateChurnRate() {
    if (excelData.periodData.length === 0) {
        return 0;
    }

    let totalClientsStart = 0;
    let totalClientsChurned = 0;

    excelData.periodData.forEach(period => {
        totalClientsStart += parseFloat(period.Clients_Start_Period) || 0;
        totalClientsChurned += parseFloat(period.Clients_Churned) || 0;
    });

    if (totalClientsStart === 0) {
        return 0;
    }

    const churnRate = (totalClientsChurned / totalClientsStart) * 100;
    return Math.round(churnRate * 100) / 100;
}

function calculateAdoptionRate() {
    let totalActiveUsers = 0;
    let totalLicenses = 0;

    excelData.accounts.forEach(account => {
        totalActiveUsers += parseFloat(account.Active_Users) || 0;
        totalLicenses += parseFloat(account.Total_Licenses) || 0;
    });

    if (totalLicenses === 0) {
        return 0;
    }

    const adoptionRate = (totalActiveUsers / totalLicenses) * 100;
    return Math.round(adoptionRate * 100) / 100;
}

function calculateRenewalRateGlobal() {
    if (excelData.periodData.length === 0) {
        return 0;
    }

    let totalEligible = 0;
    let totalRenewed = 0;

    excelData.periodData.forEach(period => {
        totalEligible += parseFloat(period.Clients_Eligible_for_Renewal) || 0;
        totalRenewed += parseFloat(period.Clients_Renewed) || 0;
    });

    if (totalEligible === 0) {
        return 0;
    }

    const renewalRate = (totalRenewed / totalEligible) * 100;
    return Math.round(renewalRate * 100) / 100;
}

function calculateNPS() {
    if (excelData.npsData.length === 0) {
        return 0;
    }

    let promoters = 0;
    let detractors = 0;
    const total = excelData.npsData.length;

    excelData.npsData.forEach(npsRecord => {
        const response = parseFloat(npsRecord.NPS_Response) || 0;
        if (response >= 9) {
            promoters++;
        } else if (response <= 6) {
            detractors++;
        }
    });

    const nps = ((promoters - detractors) / total) * 100;
    return Math.round(nps * 100) / 100;
}

function calculateRevenueAtRisk() {
    let riskRevenue = 0;

    calculatedMetrics.accountMetrics.forEach(account => {
        if (account.healthScore < 70) {
            riskRevenue += parseFloat(account.ARR_Current) || 0;
        }
    });

    return riskRevenue;
}

/* ===== HEALTH SCORE CALCULATION ===== */

function calculateHealthScore(account, periodData, npsData) {
    // Product Usage Percentage (30%)
    const productUsage = (parseFloat(account.Product_Usage_Percentage) || 0) / 100;

    // NPS Normalized (20%)
    const npsNormalized = getNPSNormalized(npsData);

    // Ticket Score (20%)
    const ticketScore = getTicketScore(account);

    // Engagement Score (15%)
    const engagementScore = getEngagementScore(account);

    // Renewal Score (15%)
    const renewalScore = getRenewalScore(periodData);

    const healthScore = 
        (productUsage * 0.30) +
        (npsNormalized * 0.20) +
        (ticketScore * 0.20) +
        (engagementScore * 0.15) +
        (renewalScore * 0.15);

    return Math.round(healthScore * 100) / 100;
}

function getNPSNormalized(npsData) {
    if (npsData.length === 0) {
        return 0.5; // Default if no data
    }

    let promoters = 0;
    let detractors = 0;

    npsData.forEach(record => {
        const response = parseFloat(record.NPS_Response) || 0;
        if (response >= 9) {
            promoters++;
        } else if (response <= 6) {
            detractors++;
        }
    });

    const nps = ((promoters - detractors) / npsData.length) * 100;
    return (nps + 100) / 200; // Normalize to 0-1 range
}

function getTicketScore(account) {
    const openTickets = parseFloat(account.Open_Tickets) || 0;
    const avgResolution = parseFloat(account.Avg_Resolution_Time) || 0;

    // If too many open tickets, reduce score
    if (openTickets > 10) return 0.3;
    if (openTickets > 5) return 0.6;

    // If resolution time is too high, reduce score
    if (avgResolution > 7) return 0.4;
    if (avgResolution > 3) return 0.7;

    return 1.0;
}

function getEngagementScore(account) {
    const lastContact = new Date(account.Last_Contact_Date);
    const today = new Date();
    const daysSinceContact = Math.floor((today - lastContact) / (1000 * 60 * 60 * 24));

    if (daysSinceContact > 90) return 0.3;
    if (daysSinceContact > 30) return 0.6;
    if (daysSinceContact > 7) return 0.8;
    return 1.0;
}

function getRenewalScore(periodData) {
    if (periodData.length === 0) {
        return 0.5;
    }

    let totalEligible = 0;
    let totalRenewed = 0;

    periodData.forEach(period => {
        totalEligible += parseFloat(period.Clients_Eligible_for_Renewal) || 0;
        totalRenewed += parseFloat(period.Clients_Renewed) || 0;
    });

    if (totalEligible === 0) {
        return 0.5;
    }

    return totalRenewed / totalEligible;
}

function calculateAdoptionRateAccount(account) {
    const activeUsers = parseFloat(account.Active_Users) || 0;
    const totalLicenses = parseFloat(account.Total_Licenses) || 0;

    if (totalLicenses === 0) {
        return 0;
    }

    const adoptionRate = (activeUsers / totalLicenses) * 100;
    return Math.round(adoptionRate * 100) / 100;
}

function calculateRenewalRateAccount(periodData) {
    if (periodData.length === 0) {
        return 0;
    }

    let totalEligible = 0;
    let totalRenewed = 0;

    periodData.forEach(period => {
        totalEligible += parseFloat(period.Clients_Eligible_for_Renewal) || 0;
        totalRenewed += parseFloat(period.Clients_Renewed) || 0;
    });

    if (totalEligible === 0) {
        return 0;
    }

    const renewalRate = (totalRenewed / totalEligible) * 100;
    return Math.round(renewalRate * 100) / 100;
}

/* ===== RISK LEVEL ===== */
function getRiskLevel(healthScore) {
    if (healthScore < 50) return 'critical';
    if (healthScore < 70) return 'high';
    if (healthScore < 85) return 'medium';
    return 'low';
}

/* ===== RENDER FUNCTIONS ===== */

function renderDashboard() {
    renderKPICards();
    renderRiskLevels();
    renderAccountsTable();
    renderHistoricalTrends();

    // Hide empty state and show sections
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('kpiSection').style.display = 'block';
    document.getElementById('riskSection').style.display = 'block';
    document.getElementById('trendsSection').style.display = 'block';
    document.getElementById('accountsSection').style.display = 'block';
}

function renderKPICards() {
    const kpis = calculatedMetrics.kpis;

    document.getElementById('mrrValue').textContent = formatCurrency(kpis.mrr);
    document.getElementById('arrValue').textContent = formatCurrency(kpis.arr);
    document.getElementById('nrrValue').textContent = formatPercentage(kpis.nrr);
    document.getElementById('churnValue').textContent = formatPercentage(kpis.churn);
    document.getElementById('npsValue').textContent = Math.round(kpis.nps);
    document.getElementById('revenueAtRiskValue').textContent = formatCurrency(kpis.revenueAtRisk);
}

function renderRiskLevels() {
    try {
    console.log('🎯 Renderizando análisis de niveles de riesgo...');
    
    // Agrupar cuentas por nivel de riesgo
    const riskGroups = {
        excellent: [],
        good: [],
        'at-risk': [],
        critical: []
    };
    
    let criticalRevenue = 0;
    let atRiskRevenue = 0;
    let healthyRevenue = 0;
    
    calculatedMetrics.accountMetrics.forEach(account => {
        const healthScore = account.healthScore;
        const mrr = parseFloat(account.MRR_Current) || 0;
        
        if (healthScore >= 80) {
            riskGroups.excellent.push(account.Account_Name);
            healthyRevenue += mrr;
        } else if (healthScore >= 60) {
            riskGroups.good.push(account.Account_Name);
            healthyRevenue += mrr;
        } else if (healthScore >= 40) {
            riskGroups['at-risk'].push(account.Account_Name);
            atRiskRevenue += mrr;
        } else {
            riskGroups.critical.push(account.Account_Name);
            criticalRevenue += mrr;
        }
    });
    
    // Actualizar contadores
    document.getElementById('excellentCount').textContent = riskGroups.excellent.length;
    document.getElementById('goodCount').textContent = riskGroups.good.length;
    document.getElementById('atRiskCount').textContent = riskGroups['at-risk'].length;
    document.getElementById('criticalCount').textContent = riskGroups.critical.length;
    
    // Actualizar lista de cuentas
    document.getElementById('excellentAccounts').textContent = 
        riskGroups.excellent.length > 0 ? riskGroups.excellent.join(', ') : 'Ninguna';
    document.getElementById('goodAccounts').textContent = 
        riskGroups.good.length > 0 ? riskGroups.good.join(', ') : 'Ninguna';
    document.getElementById('atRiskAccounts').textContent = 
        riskGroups['at-risk'].length > 0 ? riskGroups['at-risk'].join(', ') : 'Ninguna';
    document.getElementById('criticalAccounts').textContent = 
        riskGroups.critical.length > 0 ? riskGroups.critical.join(', ') : 'Ninguna';
    
    // Calcular porcentajes para las barras
    const totalRevenue = criticalRevenue + atRiskRevenue + healthyRevenue;
    const criticalPercentage = totalRevenue > 0 ? (criticalRevenue / totalRevenue) * 100 : 0;
    const atRiskPercentage = totalRevenue > 0 ? (atRiskRevenue / totalRevenue) * 100 : 0;
    const healthyPercentage = totalRevenue > 0 ? (healthyRevenue / totalRevenue) * 100 : 0;
    
    // Actualizar revenue breakdown
    document.getElementById('criticalRevenue').textContent = formatCurrency(criticalRevenue);
    document.getElementById('atRiskRevenue').textContent = formatCurrency(atRiskRevenue);
    document.getElementById('healthyRevenue').textContent = formatCurrency(healthyRevenue);
    
    // Actualizar barras con animación
    setTimeout(() => {
        document.getElementById('criticalBar').style.width = criticalPercentage + '%';
        document.getElementById('atRiskBar').style.width = atRiskPercentage + '%';
        document.getElementById('healthyBar').style.width = healthyPercentage + '%';
    }, 100);
    
    console.log(`✅ Riesgo renderizado: ${riskGroups.critical.length} críticas, ${riskGroups['at-risk'].length} en riesgo`);
    } catch (error) {
        console.error('❌ Error en renderRiskLevels:', error);
        showMessage('Error al mostrar niveles de riesgo: ' + error.message, 'error');
    }
}

function renderAccountsTable() {
    const tbody = document.getElementById('accountsTableBody');
    tbody.innerHTML = '';

    calculatedMetrics.accountMetrics.forEach((account, index) => {
        const row = document.createElement('tr');

        const riskClass = `risk-level ${account.riskLevel}`;
        const healthClass = `health-score ${getHealthScoreClass(account.healthScore)}`;

        row.innerHTML = `
            <td><strong>${account.Account_Name}</strong></td>
            <td><span class="${healthClass}">${account.healthScore}%</span></td>
            <td>${formatCurrency(account.MRR_Current)}</td>
            <td>${formatPercentage(account.adoptionRate)}</td>
            <td>${formatDate(account.Renewal_Date)}</td>
            <td><span class="${riskClass}">${getRiskLevelLabel(account.riskLevel)}</span></td>
        `;

        tbody.appendChild(row);
    });
}

/* ===== UTILITY FUNCTIONS ===== */

function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

function formatPercentage(value) {
    const num = parseFloat(value) || 0;
    return Math.round(num * 100) / 100 + '%';
}

function formatDate(dateString) {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES').format(date);
    } catch (error) {
        return dateString;
    }
}

function getHealthScoreClass(score) {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
}

function getRiskLevelLabel(riskLevel) {
    const labels = {
        'low': '✓ Bajo',
        'medium': '⚠ Medio',
        'high': '⚠ Alto',
        'critical': '🔴 Crítico'
    };
    return labels[riskLevel] || riskLevel;
}

/* ===== HISTORICAL TRENDS ===== */

// Variables globales para los gráficos
let mrrChart, churnChart, npsChart, nrrChart;

function renderHistoricalTrends() {
    console.log('📊 Renderizando tendencias históricas...');
    
    // Verificar si Chart.js está disponible
    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js no está disponible aún. Reintentando en 500ms...');
        setTimeout(renderHistoricalTrends, 500);
        return;
    }
    
    const historicalData = calculateHistoricalMetrics();
    
    if (historicalData.periods.length === 0) {
        console.warn('⚠️ No hay datos históricos suficientes');
        document.getElementById('trendsSection').style.display = 'none';
        return;
    }
    
    console.log(`✓ Datos históricos calculados: ${historicalData.periods.length} períodos`);
    
    // Destruir gráficos existentes si existen
    if (mrrChart) {
        try { mrrChart.destroy(); } catch(e) { console.warn('Error destruyendo mrrChart:', e); }
    }
    if (churnChart) {
        try { churnChart.destroy(); } catch(e) { console.warn('Error destruyendo churnChart:', e); }
    }
    if (npsChart) {
        try { npsChart.destroy(); } catch(e) { console.warn('Error destruyendo npsChart:', e); }
    }
    if (nrrChart) {
        try { nrrChart.destroy(); } catch(e) { console.warn('Error destruyendo nrrChart:', e); }
    }
    
    // Crear gráficos con try-catch individual
    try {
        createMRRChart(historicalData);
        console.log('✓ Gráfico MRR creado');
    } catch (error) {
        console.error('Error creando gráfico MRR:', error);
    }
    
    try {
        createChurnChart(historicalData);
        console.log('✓ Gráfico Churn creado');
    } catch (error) {
        console.error('Error creando gráfico Churn:', error);
    }
    
    try {
        createNPSChart(historicalData);
        console.log('✓ Gráfico NPS creado');
    } catch (error) {
        console.error('Error creando gráfico NPS:', error);
    }
    
    try {
        createNRRChart(historicalData);
        console.log('✓ Gráfico NRR creado');
    } catch (error) {
        console.error('Error creando gráfico NRR:', error);
    }
    
    console.log('✅ Gráficos históricos procesados');
}

function calculateHistoricalMetrics() {
    console.log('🔄 Calculando métricas históricas...');
    
    // Agrupar Period_Data por período
    const periodGroups = {};
    
    excelData.periodData.forEach(row => {
        const period = row.Period;
        if (!periodGroups[period]) {
            periodGroups[period] = [];
        }
        periodGroups[period].push(row);
    });
    
    // Ordenar períodos cronológicamente
    const periods = Object.keys(periodGroups).sort((a, b) => {
        const [yearA, quarterA] = a.split('-');
        const [yearB, quarterB] = b.split('-');
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        return quarterA.localeCompare(quarterB);
    });
    
    // Calcular métricas para cada período
    const historicalData = {
        periods: [],
        mrr: [],
        churn: [],
        nps: [],
        nrr: []
    };
    
    periods.forEach(period => {
        const periodData = periodGroups[period];
        
        // Calcular MRR total del período
        const totalMRR = periodData.reduce((sum, row) => {
            return sum + (parseFloat(row.MRR_Starting) || 0);
        }, 0);
        
        // Calcular Churn Rate del período
        const totalClientsStart = periodData.reduce((sum, row) => sum + (parseInt(row.Clients_Start_Period) || 0), 0);
        const totalChurned = periodData.reduce((sum, row) => sum + (parseInt(row.Clients_Churned) || 0), 0);
        const churnRate = totalClientsStart > 0 ? (totalChurned / totalClientsStart) * 100 : 0;
        
        // Calcular NPS del período
        const periodNPS = excelData.npsData.filter(row => row.Period === period);
        let promoters = 0, passives = 0, detractors = 0;
        
        periodNPS.forEach(row => {
            const score = parseInt(row.NPS_Response);
            if (score >= 9) promoters++;
            else if (score >= 7) passives++;
            else detractors++;
        });
        
        const total = promoters + passives + detractors;
        const nps = total > 0 ? ((promoters / total) * 100) - ((detractors / total) * 100) : 0;
        
        // Calcular NRR del período
        const expansion = periodData.reduce((sum, row) => sum + (parseFloat(row.Expansion_Revenue) || 0), 0);
        const contraction = periodData.reduce((sum, row) => sum + (parseFloat(row.Contraction_Revenue) || 0), 0);
        const churned = periodData.reduce((sum, row) => sum + (parseFloat(row.Churned_Revenue) || 0), 0);
        
        const nrr = totalMRR > 0 ? ((totalMRR + expansion - contraction - churned) / totalMRR) * 100 : 100;
        
        historicalData.periods.push(period);
        historicalData.mrr.push(Math.round(totalMRR));
        historicalData.churn.push(parseFloat(churnRate.toFixed(2)));
        historicalData.nps.push(parseFloat(nps.toFixed(1)));
        historicalData.nrr.push(parseFloat(nrr.toFixed(2)));
    });
    
    console.log(`✓ Calculados ${periods.length} períodos históricos`);
    return historicalData;
}

function createMRRChart(data) {
    const ctx = document.getElementById('mrrChart');
    if (!ctx) {
        console.warn('Canvas mrrChart no encontrado');
        return;
    }
    
    try {
        mrrChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.periods,
            datasets: [{
                label: 'MRR (€)',
                data: data.mrr,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'MRR: ' + new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0
                            }).format(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('es-ES', {
                                notation: 'compact',
                                compactDisplay: 'short'
                            }).format(value) + '€';
                        }
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error en createMRRChart:', error);
        throw error;
    }
}

function createChurnChart(data) {
    const ctx = document.getElementById('churnChart');
    if (!ctx) {
        console.warn('Canvas churnChart no encontrado');
        return;
    }
    
    try {
    churnChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.periods,
            datasets: [{
                label: 'Churn Rate (%)',
                data: data.churn,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Churn: ' + context.parsed.y.toFixed(2) + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error en createChurnChart:', error);
        throw error;
    }
}

function createNPSChart(data) {
    const ctx = document.getElementById('npsChart');
    if (!ctx) {
        console.warn('Canvas npsChart no encontrado');
        return;
    }
    
    try {
    npsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.periods,
            datasets: [{
                label: 'NPS',
                data: data.nps,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'NPS: ' + context.parsed.y.toFixed(1);
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: -100,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value;
                        }
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error en createNPSChart:', error);
        throw error;
    }
}

function createNRRChart(data) {
    const ctx = document.getElementById('nrrChart');
    if (!ctx) {
        console.warn('Canvas nrrChart no encontrado');
        return;
    }
    
    try {
    nrrChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.periods,
            datasets: [{
                label: 'NRR (%)',
                data: data.nrr,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'NRR: ' + context.parsed.y.toFixed(2) + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 150,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: function(context) {
                            if (context.tick.value === 100) {
                                return '#10b981';
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                        },
                        lineWidth: function(context) {
                            if (context.tick.value === 100) {
                                return 2;
                            }
                            return 1;
                        }
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error en createNRRChart:', error);
        throw error;
    }
}

/* ===== MESSAGE DISPLAY ===== */

function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';

    if (type !== 'loading') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

/* ===== CLEAR DATA ===== */

function clearData() {
    excelData = {
        accounts: [],
        periodData: [],
        npsData: []
    };

    calculatedMetrics = {
        kpis: {},
        accountMetrics: []
    };

    document.getElementById('fileInput').value = '';
    document.getElementById('clearData').style.display = 'none';
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('kpiSection').style.display = 'none';
    document.getElementById('trendsSection').style.display = 'none';
    document.getElementById('accountsSection').style.display = 'none';
    document.getElementById('message').style.display = 'none';

    // Destruir gráficos si existen
    if (window.mrrChart) window.mrrChart.destroy();
    if (window.churnChart) window.churnChart.destroy();
    if (window.npsChart) window.npsChart.destroy();
    if (window.nrrChart) window.nrrChart.destroy();

    showMessage('Datos borrados. Carga un nuevo archivo para continuar', 'info');
}
