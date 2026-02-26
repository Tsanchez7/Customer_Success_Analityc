// ===== DEMO DATA — Customer Success Analytics =====
// Se carga automáticamente cuando no hay datos reales en localStorage.
// No se guarda en localStorage para no interferir con datos reales del usuario.
// =======================================================

(function () {
    'use strict';

    // ── CUENTAS MAESTRO ────────────────────────────────────────────────────────
    const ACCOUNTS_RAW = [
        { Account_ID: 'ACC001', Account_Name: 'TechVentures Inc.',    MRR_Current: 18500, ARR_Current: 222000, Product_Usage_Percentage: 88, Active_Users: 85,  Total_Licenses: 100, Open_Tickets: 1, CSM_Name: 'Ana García',   Segment: 'Enterprise',  _base: 5200,  _nps: 8.5 },
        { Account_ID: 'ACC002', Account_Name: 'DataSphere Corp',       MRR_Current: 24000, ARR_Current: 288000, Product_Usage_Percentage: 92, Active_Users: 115, Total_Licenses: 120, Open_Tickets: 0, CSM_Name: 'Carlos Ruiz',  Segment: 'Enterprise',  _base: 6800,  _nps: 9.0 },
        { Account_ID: 'ACC003', Account_Name: 'CloudPeak Solutions',   MRR_Current: 8200,  ARR_Current: 98400,  Product_Usage_Percentage: 72, Active_Users: 38,  Total_Licenses: 50,  Open_Tickets: 3, CSM_Name: 'María López',  Segment: 'Mid-Market',  _base: 3100,  _nps: 7.2 },
        { Account_ID: 'ACC004', Account_Name: 'InnovateLabs',          MRR_Current: 12500, ARR_Current: 150000, Product_Usage_Percentage: 65, Active_Users: 52,  Total_Licenses: 80,  Open_Tickets: 5, CSM_Name: 'Ana García',   Segment: 'Mid-Market',  _base: 4500,  _nps: 6.8 },
        { Account_ID: 'ACC005', Account_Name: 'GlobalSync Group',      MRR_Current: 31000, ARR_Current: 372000, Product_Usage_Percentage: 95, Active_Users: 190, Total_Licenses: 200, Open_Tickets: 1, CSM_Name: 'Carlos Ruiz',  Segment: 'Enterprise',  _base: 8500,  _nps: 9.2 },
        { Account_ID: 'ACC006', Account_Name: 'SmartOps Ltd',          MRR_Current: 5800,  ARR_Current: 69600,  Product_Usage_Percentage: 38, Active_Users: 12,  Total_Licenses: 30,  Open_Tickets: 8, CSM_Name: 'María López',  Segment: 'SMB',         _base: 2800,  _nps: 4.5 },
        { Account_ID: 'ACC007', Account_Name: 'DigitalCore AG',        MRR_Current: 14200, ARR_Current: 170400, Product_Usage_Percentage: 78, Active_Users: 62,  Total_Licenses: 75,  Open_Tickets: 2, CSM_Name: 'Ana García',   Segment: 'Mid-Market',  _base: 4800,  _nps: 7.5 },
        { Account_ID: 'ACC008', Account_Name: 'NexusFlow Inc.',        MRR_Current: 7600,  ARR_Current: 91200,  Product_Usage_Percentage: 45, Active_Users: 18,  Total_Licenses: 40,  Open_Tickets: 6, CSM_Name: 'Carlos Ruiz',  Segment: 'SMB',         _base: 3200,  _nps: 5.2 }
    ];

    // Exportar cuentas sin campos internos
    var accounts = ACCOUNTS_RAW.map(function (a) {
        return {
            Account_ID: a.Account_ID,
            Account_Name: a.Account_Name,
            MRR_Current: a.MRR_Current,
            ARR_Current: a.ARR_Current,
            Product_Usage_Percentage: a.Product_Usage_Percentage,
            Active_Users: a.Active_Users,
            Total_Licenses: a.Total_Licenses,
            Open_Tickets: a.Open_Tickets,
            CSM_Name: a.CSM_Name,
            Segment: a.Segment
        };
    });

    // ── GENERADOR DE DATOS HISTÓRICOS ─────────────────────────────────────────
    // Multiplicadores de crecimiento por año (2016 = base, 2017 +18%, etc.)
    var yearGrowth = [1.00, 1.18, 1.22, 1.15, 0.95, 1.12, 1.20, 1.18, 1.15, 1.13, 1.10];
    var years     = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
    var quarters  = ['Q1', 'Q2', 'Q3', 'Q4'];

    var periodData = [];
    var npsData    = [];

    ACCOUNTS_RAW.forEach(function (account, ai) {
        var cumGrowth = 1.0;

        years.forEach(function (year, yi) {
            if (yi > 0) { cumGrowth *= yearGrowth[yi]; }

            quarters.forEach(function (q, qi) {
                var period = year + '-' + q;

                // Variación trimestral determinista (-3% a +4%)
                var qVar   = 1 + (((ai * 7 + qi * 13 + yi * 3) % 8) - 3) / 100;
                var mrrStart = Math.round(account._base * cumGrowth * qVar);

                // Expansion 3-7% del MRR
                var expPct   = 0.03 + ((ai * 5 + qi * 7  + yi * 11) % 5) / 100;
                var expansion = Math.round(mrrStart * expPct);

                // Contraction 1-2% del MRR
                var conPct   = 0.01 + ((ai * 3 + qi * 11 + yi *  7) % 2) / 100;
                var contraction = Math.round(mrrStart * conPct);

                // Churn Revenue 0.5-2%
                var churnPct  = 0.005 + ((ai * 9 + qi * 3 + yi * 13) % 15) / 1000;
                var churned   = Math.round(mrrStart * churnPct);

                // Clientes por registro
                var clientsStart   = 5 + (ai % 4);
                var clientsChurned = ((ai + yi + qi) % 7 === 0) ? 1 : 0;
                var clientsEligible = clientsStart;
                var clientsRenewed  = clientsStart - (((ai + yi * 2 + qi) % 8 === 0) ? 1 : 0);

                periodData.push({
                    Account_ID:                  account.Account_ID,
                    Period:                      period,
                    MRR_Starting:                mrrStart,
                    Expansion_Revenue:           expansion,
                    Contraction_Revenue:         contraction,
                    Churned_Revenue:             churned,
                    Clients_Start_Period:        clientsStart,
                    Clients_Churned:             clientsChurned,
                    Clients_Eligible_for_Renewal: clientsEligible,
                    Clients_Renewed:             clientsRenewed
                });

                // 2 respuestas NPS por cuenta por trimestre (variación determinista)
                var score1 = Math.max(0, Math.min(10, Math.round(account._nps + ((ai * 3 + yi * 7 + qi * 11) % 5) - 2)));
                var score2 = Math.max(0, Math.min(10, Math.round(account._nps + ((ai * 11 + yi * 3 + qi *  7) % 5) - 2)));

                npsData.push({ Account_ID: account.Account_ID, Period: period, NPS_Response: score1 });
                npsData.push({ Account_ID: account.Account_ID, Period: period, NPS_Response: score2 });
            });
        });
    });

    // ── EXPOSICIÓN GLOBAL ──────────────────────────────────────────────────────
    window.DEMO_DATA    = { accounts: accounts, periodData: periodData, npsData: npsData };
    window.isDemoData   = false; // se pone en true al cargar el demo, false con Excel real

    console.log('📦 demo-data.js cargado: ' +
        accounts.length + ' cuentas, ' +
        periodData.length + ' períodos, ' +
        npsData.length + ' respuestas NPS');
}());
