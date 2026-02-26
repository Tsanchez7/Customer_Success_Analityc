// ===== PDF REPORT GENERATOR — Customer Success Analytics =====
// Usa jsPDF + jsPDF-AutoTable (CDN). Funciona en las 3 páginas del dashboard.
// =============================================================

(function () {
    'use strict';

    /* ── UTILIDADES ──────────────────────────────────────────────────────────── */
    const fmtCurrency = v => '$' + Math.round(v || 0).toLocaleString('en-US');
    const fmtPct      = v => (parseFloat(v) || 0).toFixed(1) + '%';

    const COLORS = {
        primary : [59,  130, 246],
        success : [16,  185, 129],
        warning : [245, 158, 11],
        danger  : [239, 68,  68],
        purple  : [139, 92,  246],
        orange  : [249, 115, 22],
        dark    : [31,  41,  55],
        muted   : [107, 114, 128],
        light   : [249, 250, 251],
        white   : [255, 255, 255],
    };

    /* ── CÓMPUTO DE MÉTRICAS POR AÑO (funciona sin calculatedMetrics) ─────── */
    function computeYearMetrics(data) {
        const byYear = {};
        data.periodData.forEach(r => {
            const year = (r.Period || '').split('-')[0];
            if (!year) return;
            if (!byYear[year]) byYear[year] = { mrr:0, exp:0, con:0, churn:0, cs:0, cc:0, cnt:0 };
            const y = byYear[year];
            y.mrr   += parseFloat(r.MRR_Starting)            || 0;
            y.exp   += parseFloat(r.Expansion_Revenue)       || 0;
            y.con   += parseFloat(r.Contraction_Revenue)     || 0;
            y.churn += parseFloat(r.Churned_Revenue)         || 0;
            y.cs    += parseInt(r.Clients_Start_Period)       || 0;
            y.cc    += parseInt(r.Clients_Churned)            || 0;
            y.cnt++;
        });
        return Object.keys(byYear).sort().map(year => {
            const y = byYear[year];
            const avgMRR   = y.cnt ? y.mrr / y.cnt : 0;
            const nrr      = y.mrr > 0 ? ((y.mrr + y.exp - y.con - y.churn) / y.mrr) * 100 : 100;
            const churnRate = y.cs > 0 ? (y.cc / y.cs) * 100 : 0;
            const npsRec   = data.npsData.filter(n => (n.Period || '').startsWith(year));
            let nps = 0;
            if (npsRec.length) {
                let p = 0, d = 0;
                npsRec.forEach(n => { const s = parseInt(n.NPS_Response); if (s >= 9) p++; else if (s <= 6) d++; });
                nps = Math.round(((p - d) / npsRec.length) * 100);
            }
            return { year, avgMRR: Math.round(avgMRR), arr: Math.round(avgMRR * 12), nrr: Math.round(nrr * 10) / 10, churnRate: Math.round(churnRate * 10) / 10, nps };
        });
    }

    /* ── CÓMPUTO DE MÉTRICAS POR CUENTA (fallback si no hay calculatedMetrics) */
    function computeAccountMetrics(data) {
        const cm = (typeof calculatedMetrics !== 'undefined' ? calculatedMetrics : null);
        if (cm && cm.accountMetrics && cm.accountMetrics.length > 0) return cm.accountMetrics;

        return data.accounts.map(account => {
            const accP   = data.periodData.filter(p => p.Account_ID === account.Account_ID);
            const accNPS = data.npsData.filter(n => n.Account_ID === account.Account_ID);
            const usage    = parseFloat(account.Product_Usage_Percentage) || 0;
            const adoption = (parseFloat(account.Active_Users) || 0) / (parseFloat(account.Total_Licenses) || 1);
            const tickets  = parseInt(account.Open_Tickets) || 0;
            let npsScore = 0.5;
            if (accNPS.length) {
                const avg = accNPS.reduce((s, n) => s + parseInt(n.NPS_Response), 0) / accNPS.length;
                npsScore = avg / 10;
            }
            const healthScore = Math.round(((usage / 100) * 0.30 + Math.min(adoption, 1) * 0.25 + Math.max(0, 1 - tickets * 0.05) * 0.25 + npsScore * 0.20) * 100);
            let riskLevel = healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'at-risk' : 'critical';
            return {
                ...account,
                healthScore,
                riskLevel,
                healthComponents: { usage, adoption: Math.round(adoption * 100), tickets, nps: Math.round(npsScore * 10) }
            };
        });
    }

    /* ── PLAN METODOLÓGICO CS POR CUENTA ──────────────────────────────────── */
    // Devuelve array de { title, color, items[] } para el informe PDF
    function buildPlan(account) {
        const comp   = account.healthComponents || {};
        const usage  = comp.usage    || 0;
        const adopt  = comp.adoption || 0;
        const tix    = comp.tickets  != null ? comp.tickets : (parseInt(account.Open_Tickets) || 0);
        const npsAvg = comp.nps      || 0;
        const hs     = account.healthScore || 0;
        const mrr    = parseFloat(account.MRR_Current) || 0;
        const sections = [];

        /* ── A. RISK ASSESSMENT ─────────────────────────────────────────────── */
        const raItems = [
            'Champion: Identificar al usuario mas activo y su nivel de influencia interna. Confirmar si es el interlocutor habitual o si hay que elevar el contacto.',
            'Decision Maker (DM): Confirmar quien tiene autoridad para renovar y su percepcion actual de valor.',
            'Economic Buyer (EB): Mapear la aprobacion presupuestaria — fecha de vencimiento de contrato y ciclo de compra.',
        ];
        if (usage < 40)
            raItems.push('Causa raiz probable: Baja adopcion (' + usage + '% de uso). El producto no esta integrado en el workflow diario del equipo.');
        else if (tix >= 6)
            raItems.push('Causa raiz probable: Friccion tecnica acumulada (' + tix + ' tickets abiertos). Los bloqueos sin resolver deterioran la experiencia y la confianza.');
        else if (npsAvg < 6)
            raItems.push('Causa raiz probable: Insatisfaccion relacional (NPS media ' + npsAvg + '/10). Expectativas del contrato no alineadas con la entrega real.');
        else
            raItems.push('Causa raiz probable: Combinacion de factores — diagnosticar en la primera llamada con Champion y DM.');
        raItems.push('Nivel de urgencia: ' + (hs < 30 ? 'CRITICO MAXIMO — riesgo de churn inminente en los proximos 30 dias. Accion este mismo dia.' : hs < 40 ? 'CRITICO — intervencion urgente, escalada ejecutiva en max. 48 horas.' : 'ELEVADO — deterioro sostenido, activar plan de accion en max. 2 semanas.'));
        sections.push({ title: 'A. Risk Assessment', color: COLORS.danger, items: raItems });

        /* ── B. SUCCESS PLAN ────────────────────────────────────────────────── */
        const spItems = [
            'KPIs de negocio vinculados: Documentar 2-3 metricas clave del cliente que el producto impacta directamente (ej. tiempo ahorrado, errores reducidos, ingresos generados).',
            'Casos de uso prioritarios: Identificar los flujos criticos donde el producto aporta mas valor. Garantizar que el Champion los domina y los puede evangelizar internamente.',
            'Quick win 30 dias: Definir 1 logro tangible y visible que el cliente pueda comunicar internamente como exito — esto refuerza la percepcion de valor ante el DM.',
        ];
        if (mrr >= 5000)
            spItems.push('MRR ' + fmtCurrency(mrr) + ' en juego: Preparar Business Case que cuantifique ROI real vs coste de churnar (incluir coste de migracion, curva aprendizaje y riesgo de integracion) para presentar al EB.');
        sections.push({ title: 'B. Success Plan', color: COLORS.primary, items: spItems });

        /* ── C. ACCIONES ESPECIFICAS POR NIVEL ──────────────────────────────── */
        const actItems = [];
        if (hs < 30) {
            // Recovery intensivo en 3 fases
            actItems.push('FASE 1 — Diagnostico (Semanas 1-2): Llamada con Champion (60 min) para auditar friction points sin agenda de venta. Encuesta interna anonima de 5 preguntas max. Sesion con DM para revisar expectativas vs realidad.');
            actItems.push('FASE 1 — Auditoria de producto: Analizar logs de uso para identificar funcionalidades bloqueadas o no utilizadas. Compartir informe de hallazgos por escrito en los 5 dias siguientes.');
            actItems.push('FASE 2 — Plan de Rescate (Dias 15-45): Check-ins diarios con Champion (15 min). Sprint tecnico dedicado para cerrar los 3 tickets mas criticos. Programa Power User: 2 sesiones de capacitacion intensiva con los usuarios clave.');
            actItems.push('FASE 2 — Exit criteria: Definir metricas objetivas para considerar la cuenta estabilizada (ej. uso >50%, tickets abiertos <3, NPS >6/10). Revisar avance cada semana con semaforo de estado compartido.');
            actItems.push('FASE 3 — Executive QBR (Dia 60): Presentacion a C-Level del ROI generado. Cuantificar valor en terminos del cliente (horas ahorradas, errores evitados, etc.). Firmar compromiso de Monthly Business Review los proximos 6 meses.');
        } else if (hs < 40) {
            actItems.push('INTERVENCION CRITICA Semana 1: Escalada interna a VP/Director CS. Notificar al C-Level del cliente. Convocar reunion de emergencia en max. 5 dias habiles con agenda clara y compromisos concretos.');
            actItems.push('QBR de Emergencia (Dias 5-10): Revisar ROI real entregado vs expectativas del contrato. Compromisos escritos por ambas partes con plazos. Acta de sesion firmada.');
            actItems.push('War Room tecnica (si aplica): Si hay >5 tickets, sesion conjunta CSM + Technical Support + cliente de 2 horas para resolver bloqueos en tiempo real. Cierre de todos los tickets P1 en 48h.');
            actItems.push('CSM Senior dedicado 60 dias: Check-ins semanales con agenda estructurada (metricas, bloqueos, proximos pasos), actas de avance y semaforo compartido en cada sesion.');
        } else {
            actItems.push('Cadencia proactiva semanal (4 semanas): Llamada de 30 min con agenda fija — metricas de uso, objetivos del trimestre, feedback abierto. Enviar resumen post-llamada con acuerdos y responsables.');
            if (usage < 55)
                actItems.push('Micro-formaciones de uso (uso actual ' + usage + '%): Sesiones de 20 min enfocadas en los casos de uso especificos del cliente. Asignar un Power User interno para liderar la adopcion desde dentro. Proporcionar material de autoservicio personalizado.');
            if (tix >= 4)
                actItems.push('Gestion proactiva de tickets (' + tix + ' abiertos): Revisar estado en cada check-in. Si algun ticket supera 7 dias sin resolucion, escalar a Support Manager con SLA comprometido por escrito.');
            actItems.push('Identificar oportunidades de expansion: Mapear departamentos sin acceso al producto. Una cuenta estabilizada es la base ideal para proponer un upsell fundamentado en ROI demostrado.');
        }
        sections.push({ title: 'C. Acciones por Nivel de Riesgo', color: hs < 40 ? COLORS.danger : COLORS.orange, items: actItems });

        /* ── D. SEÑALES TEMPRANAS ────────────────────────────────────────────── */
        sections.push({ title: 'D. Senales Tempranas a Monitorizar', color: COLORS.purple, items: [
            'Alerta roja: NPS cae mas de 2 puntos en una encuesta — activar check-in inmediato ese dia.',
            'Alerta roja: Uso del producto cae mas de un 15% en 30 dias — investigar cambios internos del cliente (reorganizacion, nuevo responsable, etc.).',
            'Alerta naranja: Volumen de tickets supera 5 en el mes — escalar a Support Manager con informe de incidencias.',
            'Alerta naranja: Sin login activo durante 14 dias consecutivos — contacto proactivo ese mismo dia con oferta de sesion de re-activacion.',
        ]});

        /* ── E. KPIs A MONITORIZAR (90 días) ───────────────────────────────── */
        sections.push({ title: 'E. KPIs a Monitorizar (90 dias)', color: COLORS.success, items: [
            'Porcentaje de uso del producto — objetivo: >' + Math.min(usage + 20, 80) + '% al final de 90 dias.',
            'Tasa de adopcion de licencias — objetivo: >' + Math.min(adopt + 15, 80) + '% de licencias activas.',
            'Tiempo medio de resolucion de tickets — objetivo: P1 <48h, P2 <72h, P3 <5 dias.',
            'NPS en proxima encuesta — objetivo: mejora de al menos 1.5 puntos sobre el valor actual.',
            'Estabilidad de MRR: sin contraccion, sin señales de downgrade ni reduccion de licencias.',
            'Frecuencia de login semanal — objetivo: minimo ' + (usage < 40 ? '3' : '5') + ' sesiones activas por semana por usuario licenciado.',
        ]});

        return sections;
    }

    /* ── FUNCIÓN PRINCIPAL ───────────────────────────────────────────────────── */
    window.generatePDFReport = function () {
        if (typeof window.jspdf === 'undefined') {
            alert('La libreria PDF aun no ha cargado. Espera un momento y vuelve a intentarlo.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc  = new jsPDF('p', 'mm', 'a4');
        const PW   = doc.internal.pageSize.getWidth();
        const PH   = doc.internal.pageSize.getHeight();
        const M    = 18;
        const CW   = PW - M * 2;

        // excelData y calculatedMetrics son let-globals (no window.*)
        const data   = (typeof excelData !== 'undefined' ? excelData : null)
                    || { accounts:[], periodData:[], npsData:[] };
        const isDemo = window.isDemoData === true;
        const today  = new Date();
        const dateStr = today.toLocaleDateString('es-ES', { year:'numeric', month:'long', day:'numeric' });

        const yearMetrics    = computeYearMetrics(data);
        const accountMetrics = computeAccountMetrics(data);
        const atRisk         = accountMetrics.filter(a => a.healthScore < 60);

        // KPIs de portada
        const cm = (typeof calculatedMetrics !== 'undefined' ? calculatedMetrics : null);
        let kpis  = {};
        if (cm && cm.kpis && cm.kpis.mrr) {
            kpis = cm.kpis;
        } else if (yearMetrics.length) {
            const last = yearMetrics[yearMetrics.length - 1];
            kpis = { mrr: last.avgMRR, arr: last.arr, nrr: last.nrr, churn: last.churnRate, nps: last.nps };
        }

        /* ── PÁGINA 1: PORTADA ─────────────────────────────────────────────── */
        // Header degradado
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, 0, PW, 72, 'F');
        doc.setFillColor(...COLORS.purple);
        // Acento triangular derecha
        doc.setFillColor(99, 102, 241);
        doc.rect(PW - 8, 0, 8, 72, 'F');

        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(26);
        doc.text('Customer Success Analytics', M, 32);
        doc.setFontSize(18);
        doc.text('Informe Completo de Analisis', M, 48);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Resumen ejecutivo · Health Score · Cuentas en riesgo · Plan de accion', M, 62);

        // Metadata strip
        doc.setFillColor(241, 245, 249);
        doc.rect(0, 72, PW, 44, 'F');
        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const years = [...new Set(data.periodData.map(p => (p.Period||'').split('-')[0]))].filter(Boolean).sort();
        doc.text(`Fecha: ${dateStr}`, M, 87);
        doc.text(`Cuentas analizadas: ${data.accounts.length}`, M, 99);
        doc.text(`Periodos: ${years.length ? years[0] + ' - ' + years[years.length-1] : 'N/A'}`, M, 111);

        // Banner demo
        let yStart = 128;
        if (isDemo) {
            doc.setFillColor(...COLORS.warning);
            doc.roundedRect(M, 120, CW, 12, 3, 3, 'F');
            doc.setTextColor(...COLORS.white);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('DATOS DE DEMOSTRACION — Carga tu Excel real para obtener tu informe personalizado', M + 4, 128);
            yStart = 142;
        }

        // KPI cards en portada (2 filas × 3 columnas)
        const kpiBoxes = [
            { label: 'MRR',               value: fmtCurrency(kpis.mrr),             color: COLORS.primary },
            { label: 'ARR',               value: fmtCurrency(kpis.arr),             color: COLORS.purple  },
            { label: 'NRR',               value: fmtPct(kpis.nrr),                  color: COLORS.success },
            { label: 'Churn Rate',        value: fmtPct(kpis.churn),                color: COLORS.danger  },
            { label: 'NPS',               value: String(Math.round(kpis.nps || 0)), color: COLORS.warning },
            { label: 'Cuentas en Riesgo', value: String(atRisk.length),             color: COLORS.orange  },
        ];
        const bW = (CW - 10) / 3;
        const bH = 28;
        kpiBoxes.forEach((b, i) => {
            const cx = M + (i % 3) * (bW + 5);
            const cy = yStart + Math.floor(i / 3) * (bH + 5);
            doc.setFillColor(...b.color);
            doc.roundedRect(cx, cy, bW, bH, 4, 4, 'F');
            doc.setTextColor(...COLORS.white);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.text(b.value, cx + bW / 2, cy + 12, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(b.label, cx + bW / 2, cy + 22, { align: 'center' });
        });

        // Footer portada
        doc.setFillColor(...COLORS.dark);
        doc.rect(0, PH - 14, PW, 14, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(8);
        doc.text('Customer Success Analytics Platform  |  customersuccessanalityc.vercel.app', PW / 2, PH - 5, { align: 'center' });

        /* ── PÁGINA 2: EVOLUCIÓN HISTÓRICA ─────────────────────────────────── */
        if (yearMetrics.length > 0) {
            doc.addPage();
            _pageHeader(doc, PW, M, '   Evolucion Historica de Metricas', COLORS.primary, '2');

            doc.autoTable({
                startY: 32,
                head: [['Año', 'MRR Medio', 'ARR', 'NRR', 'Churn', 'NPS', 'Estado']],
                body: yearMetrics.map(m => {
                    const st = m.nrr >= 100 && m.churnRate < 10 ? 'Saludable' : m.nrr >= 97 ? 'Regular' : 'Critico';
                    return [m.year, fmtCurrency(m.avgMRR), fmtCurrency(m.arr), fmtPct(m.nrr), fmtPct(m.churnRate), String(m.nps), st];
                }),
                styles:          { fontSize: 9, cellPadding: 4, textColor: COLORS.dark },
                headStyles:      { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
                alternateRowStyles: { fillColor: COLORS.light },
                columnStyles:    { 0: { fontStyle: 'bold', cellWidth: 18 }, 6: { cellWidth: 24 } },
                margin:          { left: M, right: M },
            });

            if (yearMetrics.length >= 2) {
                const f = yearMetrics[0], l = yearMetrics[yearMetrics.length - 1];
                const growthPct = ((l.avgMRR - f.avgMRR) / f.avgMRR * 100).toFixed(1);
                const nYears    = yearMetrics.length - 1;
                const cagr      = nYears > 0 ? ((Math.pow(l.avgMRR / f.avgMRR, 1 / nYears) - 1) * 100).toFixed(1) : 0;
                const fy        = doc.lastAutoTable.finalY + 8;

                doc.setFillColor(240, 249, 255);
                doc.roundedRect(M, fy, CW, 26, 4, 4, 'F');
                doc.setFillColor(...COLORS.primary);
                doc.roundedRect(M, fy, 3, 26, 2, 2, 'F');
                doc.setTextColor(...COLORS.dark);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('Resumen de Crecimiento', M + 8, fy + 9);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.text(`Crecimiento total MRR: +${growthPct}%   |   CAGR: ${cagr}%   |   De ${fmtCurrency(f.avgMRR)} a ${fmtCurrency(l.avgMRR)}`, M + 8, fy + 20);
            }
        }

        /* ── PÁGINA 3: ANÁLISIS DE CUENTAS ─────────────────────────────────── */
        doc.addPage();
        _pageHeader(doc, PW, M, '   Analisis de Salud de Cuentas', COLORS.primary, '3');

        // Contadores de riesgo
        const rc = { excellent: 0, good: 0, atRisk: 0, critical: 0 };
        accountMetrics.forEach(a => {
            if      (a.riskLevel === 'excellent') rc.excellent++;
            else if (a.riskLevel === 'good')      rc.good++;
            else if (a.riskLevel === 'at-risk')   rc.atRisk++;
            else                                  rc.critical++;
        });
        const rboxes = [
            { label: 'Excelente (>=80)', count: rc.excellent, color: COLORS.success },
            { label: 'Bueno (60-79)',    count: rc.good,      color: [251, 191, 36]  },
            { label: 'En Riesgo (40-59)',count: rc.atRisk,    color: COLORS.orange   },
            { label: 'Critico (<40)',    count: rc.critical,  color: COLORS.danger   },
        ];
        const rbW = (CW - 15) / 4;
        rboxes.forEach((rb, i) => {
            const x = M + i * (rbW + 5);
            doc.setFillColor(...rb.color);
            doc.roundedRect(x, 30, rbW, 20, 3, 3, 'F');
            doc.setTextColor(...COLORS.white);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(String(rb.count), x + rbW / 2, 42, { align: 'center' });
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(rb.label, x + rbW / 2, 48, { align: 'center' });
        });

        const riskLabel = { excellent: 'Excelente', good: 'Bueno', 'at-risk': 'En Riesgo', critical: 'Critico' };
        doc.autoTable({
            startY: 56,
            head: [['Cuenta', 'MRR', 'Health', 'Uso', 'Adopcion', 'Tickets', 'NPS Resp.', 'Riesgo', 'CSM']],
            body: accountMetrics.map(a => {
                const c = a.healthComponents || {};
                return [
                    a.Account_Name || a.Account_ID,
                    fmtCurrency(a.MRR_Current),
                    String(a.healthScore) + '/100',
                    String(c.usage || 0) + '%',
                    String(c.adoption || 0) + '%',
                    String(c.tickets != null ? c.tickets : (a.Open_Tickets || 0)),
                    String(c.nps || 0),
                    riskLabel[a.riskLevel] || a.riskLevel,
                    a.CSM_Name || '-',
                ];
            }),
            styles:             { fontSize: 8, cellPadding: 3, textColor: COLORS.dark },
            headStyles:         { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: COLORS.light },
            columnStyles:       { 0: { fontStyle: 'bold', cellWidth: 32 }, 2: { cellWidth: 20 }, 7: { cellWidth: 22 } },
            margin:             { left: M, right: M },
        });

        /* ── PÁGINAS 4+: UNA PÁGINA POR CUENTA EN RIESGO ────────────────────── */
        atRisk.forEach((account, idx) => {
            const plan        = buildPlan(account);
            const isCritical  = account.riskLevel === 'critical';
            const headerColor = isCritical ? COLORS.danger : COLORS.orange;
            const comp = account.healthComponents || {};
            const tixNum = comp.tickets != null ? comp.tickets : (account.Open_Tickets || 0);

            doc.addPage();
            const pageLabel = '   Cuenta ' + (idx + 1) + ' / ' + atRisk.length + ' — Plan de Accion';
            _pageHeader(doc, PW, M, pageLabel, headerColor, String(4 + idx));

            // ── Ficha resumen de cuenta ──────────────────────────────────────
            doc.setFillColor(...(isCritical ? [255, 245, 245] : [255, 250, 240]));
            doc.roundedRect(M, 28, CW, 30, 3, 3, 'F');
            doc.setFillColor(...headerColor);
            doc.roundedRect(M, 28, 4, 30, 2, 2, 'F');

            // Nombre + Health Score
            doc.setTextColor(...headerColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text((account.Account_Name || account.Account_ID) + '  \u2014  Health Score: ' + account.healthScore + ' / 100', M + 8, 38);

            // Badge nivel de riesgo
            const riskBadgeText = isCritical ? 'CRITICO' : 'EN RIESGO';
            const badgeW = 24;
            doc.setFillColor(...headerColor);
            doc.roundedRect(M + CW - badgeW - 2, 29, badgeW, 9, 2, 2, 'F');
            doc.setTextColor(...COLORS.white);
            doc.setFontSize(7);
            doc.text(riskBadgeText, M + CW - badgeW / 2 - 2, 35, { align: 'center' });

            // Metricas clave en una linea
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...COLORS.dark);
            const metrLine = 'MRR: ' + fmtCurrency(account.MRR_Current) +
                '   Uso: ' + (comp.usage || 0) + '%' +
                '   Adopcion: ' + (comp.adoption || 0) + '%' +
                '   Tickets: ' + tixNum +
                '   NPS resp.: ' + (comp.nps || 0) + '/10' +
                '   CSM: ' + (account.CSM_Name || '-');
            const metrLines = doc.splitTextToSize(metrLine, CW - 12);
            doc.text(metrLines, M + 8, 47);

            // ── Secciones metodologicas ──────────────────────────────────────
            let yPos = 64;
            plan.forEach(section => {
                yPos = _sectionBlock(doc, PW, M, CW, PH, yPos, section.title, section.color, section.items);
                yPos += 5;
            });
        });

        /* ── FOOTER EN TODAS LAS PÁGINAS (desde la 2) ──────────────────────── */
        const total = doc.internal.getNumberOfPages();
        for (let p = 2; p <= total; p++) {
            doc.setPage(p);
            doc.setFillColor(...COLORS.dark);
            doc.rect(0, PH - 12, PW, 12, 'F');
            doc.setTextColor(...COLORS.white);
            doc.setFontSize(8);
            doc.text('Customer Success Analytics  |  customersuccessanalityc.vercel.app', M, PH - 4);
            doc.text(`Pag. ${p} / ${total}`, PW - M, PH - 4, { align: 'right' });
        }

        /* ── GUARDAR ──────────────────────────────────────────────────────── */
        const fname = `CS_Analytics_${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}.pdf`;
        doc.save(fname);
    };

    /* ── HELPER: cabecera de página ──────────────────────────────────────────── */
    function _pageHeader(doc, PW, M, title, color, pageNum) {
        doc.setFillColor(...color);
        doc.rect(0, 0, PW, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(title, M, 17);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Pagina ' + pageNum, PW - M, 17, { align: 'right' });
    }

    /* ── HELPER: bloque de sección con titulo coloreado + bullets ───────────── */
    // Devuelve la nueva yPos tras renderizar el bloque
    function _sectionBlock(doc, PW, M, CW, PH, yTop, title, color, items) {
        const lineH   = 5.5;   // altura de línea de texto (mm)
        const padV    = 5;     // padding vertical interior
        const titleH  = 10;    // altura de la barra de titulo
        const textW   = CW - 14;

        // Pre-calcular altura total del bloque
        let totalTextH = 0;
        const allLines = items.map(item => {
            const lines = doc.splitTextToSize('• ' + item, textW);
            totalTextH += lines.length * lineH + 2;
            return lines;
        });
        const blockH = titleH + padV + totalTextH + padV;

        // Nueva página si no cabe
        if (yTop + blockH > PH - 16) {
            doc.addPage();
            doc.setFillColor(...color);
            doc.rect(0, 0, PW, 18, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('Continuacion: ' + title, M, 13);
            yTop = 24;
        }

        // Fondo del bloque
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(M, yTop, CW, blockH, 3, 3, 'F');

        // Barra de título
        doc.setFillColor(...color);
        doc.roundedRect(M, yTop, CW, titleH, 3, 3, 'F');
        doc.rect(M, yTop + titleH / 2, CW, titleH / 2, 'F'); // esquinas inferiores rectas
        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(title, M + 5, yTop + 7);

        // Barra lateral de acento
        doc.setFillColor(...color);
        doc.rect(M, yTop + titleH, 3, blockH - titleH, 'F');

        // Items
        let yText = yTop + titleH + padV + lineH - 1;
        allLines.forEach(lines => {
            doc.setTextColor(...COLORS.dark);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(lines, M + 8, yText);
            yText += lines.length * lineH + 2;
        });

        return yTop + blockH;
    }

}());
