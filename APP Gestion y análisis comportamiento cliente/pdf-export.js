// ===== PDF REPORT GENERATOR — Customer Success Analytics =====
// Usa jsPDF + jsPDF-AutoTable (CDN). Funciona en las 3 páginas del dashboard.
// =============================================================

(function () {
    'use strict';

    /* ── VERIFICACIÓN DE CARGA DE jsPDF ─────────────────────────────────────── */
    // Normaliza la referencia independientemente del build UMD que se haya cargado
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF !== 'undefined') {
        window.jspdf = { jsPDF: window.jsPDF };
    }

    /* ── UTILIDADES ──────────────────────────────────────────────────────────── */
    const fmtCurrency = v => Math.round(v || 0).toLocaleString('es-ES') + ' €';
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
            'Champion: Identificar al usuario más activo y su nivel de influencia interna. Confirmar si es el interlocutor habitual o si hay que elevar el contacto.',
            'Decision Maker (DM): Confirmar quién tiene autoridad para renovar y su percepción actual de valor.',
            'Economic Buyer (EB): Mapear la aprobación presupuestaria — fecha de vencimiento de contrato y ciclo de compra.',
        ];
        if (usage < 40)
            raItems.push('Causa raíz probable: Baja adopción (' + usage + '% de uso). El producto no está integrado en el workflow diario del equipo.');
        else if (tix >= 6)
            raItems.push('Causa raíz probable: Fricción técnica acumulada (' + tix + ' tickets abiertos). Los bloqueos sin resolver deterioran la experiencia y la confianza.');
        else if (npsAvg < 6)
            raItems.push('Causa raíz probable: Insatisfacción relacional (NPS media ' + npsAvg + '/10). Expectativas del contrato no alineadas con la entrega real.');
        else
            raItems.push('Causa raíz probable: Combinación de factores — diagnosticar en la primera llamada con Champion y DM.');
        raItems.push('Nivel de urgencia: ' + (hs < 30 ? 'CRÍTICO MÁXIMO — riesgo de churn inminente en los próximos 30 días. Acción este mismo día.' : hs < 40 ? 'CRÍTICO — intervención urgente, escalada ejecutiva en max. 48 horas.' : 'ELEVADO — deterioro sostenido, activar plan de acción en max. 2 semanas.'));
        sections.push({ title: 'A. Risk Assessment', color: COLORS.danger, items: raItems });

        /* ── B. SUCCESS PLAN ────────────────────────────────────────────────── */
        const spItems = [
            'KPIs de negocio vinculados: Documentar 2-3 métricas clave del cliente que el producto impacta directamente (ej. tiempo ahorrado, errores reducidos, ingresos generados).',
            'Casos de uso prioritarios: Identificar los flujos críticos donde el producto aporta más valor. Garantizar que el Champion los domina y los puede evangelizar internamente.',
            'Quick win 30 días: Definir 1 logro tangible y visible que el cliente pueda comunicar internamente como éxito — esto refuerza la percepción de valor ante el DM.',
        ];
        if (mrr >= 5000)
            spItems.push('MRR ' + fmtCurrency(mrr) + ' en juego: Preparar Business Case que cuantifique ROI real vs coste de churnar (incluir coste de migración, curva aprendizaje y riesgo de integración) para presentar al EB.');
        sections.push({ title: 'B. Success Plan', color: COLORS.primary, items: spItems });

        /* ── C. ACCIONES ESPECIFICAS POR NIVEL ──────────────────────────────── */
        const actItems = [];
        if (hs < 30) {
            // Recovery intensivo en 3 fases
            actItems.push('FASE 1 — Diagnóstico (Semanas 1-2): Llamada con Champion (60 min) para auditar friction points sin agenda de venta. Encuesta interna anónima de 5 preguntas max. Sesión con DM para revisar expectativas vs realidad.');
            actItems.push('FASE 1 — Auditoría de producto: Analizar logs de uso para identificar funcionalidades bloqueadas o no utilizadas. Compartir informe de hallazgos por escrito en los 5 días siguientes.');
            actItems.push('FASE 2 — Plan de Rescate (Días 15-45): Check-ins diarios con Champion (15 min). Sprint técnico dedicado para cerrar los 3 tickets más críticos. Programa Power User: 2 sesiones de capacitación intensiva con los usuarios clave.');
            actItems.push('FASE 2 — Exit criteria: Definir métricas objetivas para considerar la cuenta estabilizada (ej. uso >50%, tickets abiertos <3, NPS >6/10). Revisar avance cada semana con semáforo de estado compartido.');
            actItems.push('FASE 3 — Executive QBR (Día 60): Presentación a C-Level del ROI generado. Cuantificar valor en términos del cliente (horas ahorradas, errores evitados, etc.). Firmar compromiso de Monthly Business Review los próximos 6 meses.');
        } else if (hs < 40) {
            actItems.push('INTERVENCIÓN CRÍTICA Semana 1: Escalada interna a VP/Director CS. Notificar al C-Level del cliente. Convocar reunión de emergencia en max. 5 días hábiles con agenda clara y compromisos concretos.');
            actItems.push('QBR de Emergencia (Días 5-10): Revisar ROI real entregado vs expectativas del contrato. Compromisos escritos por ambas partes con plazos. Acta de sesión firmada.');
            actItems.push('War Room técnica (si aplica): Si hay >5 tickets, sesión conjunta CSM + Technical Support + cliente de 2 horas para resolver bloqueos en tiempo real. Cierre de todos los tickets P1 en 48h.');
            actItems.push('CSM Senior dedicado 60 días: Check-ins semanales con agenda estructurada (métricas, bloqueos, próximos pasos), actas de avance y semáforo compartido en cada sesión.');
        } else {
            actItems.push('Cadencia proactiva semanal (4 semanas): Llamada de 30 min con agenda fija — métricas de uso, objetivos del trimestre, feedback abierto. Enviar resumen post-llamada con acuerdos y responsables.');
            if (usage < 55)
                actItems.push('Micro-formaciones de uso (uso actual ' + usage + '%): Sesiones de 20 min enfocadas en los casos de uso específicos del cliente. Asignar un Power User interno para liderar la adopción desde dentro. Proporcionar material de autoservicio personalizado.');
            if (tix >= 4)
                actItems.push('Gestión proactiva de tickets (' + tix + ' abiertos): Revisar estado en cada check-in. Si algún ticket supera 7 días sin resolución, escalar a Support Manager con SLA comprometido por escrito.');
            actItems.push('Identificar oportunidades de expansión: Mapear departamentos sin acceso al producto. Una cuenta estabilizada es la base ideal para proponer un upsell fundamentado en ROI demostrado.');
        }
        sections.push({ title: 'C. Acciones por Nivel de Riesgo', color: hs < 40 ? COLORS.danger : COLORS.orange, items: actItems });

        /* ── D. SEÑALES TEMPRANAS ────────────────────────────────────────────── */
        sections.push({ title: 'D. Señales Tempranas a Monitorizar', color: COLORS.purple, items: [
            'Alerta roja: NPS cae más de 2 puntos en una encuesta — activar check-in inmediato ese día.',
            'Alerta roja: Uso del producto cae más de un 15% en 30 días — investigar cambios internos del cliente (reorganización, nuevo responsable, etc.).',
            'Alerta naranja: Volumen de tickets supera 5 en el mes — escalar a Support Manager con informe de incidencias.',
            'Alerta naranja: Sin login activo durante 14 días consecutivos — contacto proactivo ese mismo día con oferta de sesión de re-activación.',
        ]});

        /* ── E. KPIs A MONITORIZAR (90 días) ───────────────────────────────── */
        sections.push({ title: 'E. KPIs a Monitorizar (90 días)', color: COLORS.success, items: [
            'Porcentaje de uso del producto — objetivo: >' + Math.min(usage + 20, 80) + '% al final de 90 días.',
            'Tasa de adopción de licencias — objetivo: >' + Math.min(adopt + 15, 80) + '% de licencias activas.',
            'Tiempo medio de resolución de tickets — objetivo: P1 <48h, P2 <72h, P3 <5 días.',
            'NPS en próxima encuesta — objetivo: mejora de al menos 1.5 puntos sobre el valor actual.',
            'Estabilidad de MRR: sin contracción, sin señales de downgrade ni reducción de licencias.',
            'Frecuencia de login semanal — objetivo: mínimo ' + (usage < 40 ? '3' : '5') + ' sesiones activas por semana por usuario licenciado.',
        ]});

        return sections;
    }

    /* ── FUNCIÓN PRINCIPAL ───────────────────────────────────────────────────── */
    function loadImageAsDataURL(src, circleSize) {
        const drawCircle = (img) => {
            const size = circleSize || 200;
            const c = document.createElement('canvas');
            c.width = size; c.height = size;
            const ctx = c.getContext('2d');
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
            const sw = img.naturalWidth * scale;
            const sh = img.naturalHeight * scale;
            ctx.drawImage(img, (size - sw) / 2, (size - sh) / 2, sw, sh);
            return c.toDataURL('image/png');
        };
        return new Promise(resolve => {
            // Intento 1: fetch (funciona en HTTP/HTTPS, evita canvas tainted)
            fetch(src)
                .then(r => r.blob())
                .then(blob => {
                    const blobURL = URL.createObjectURL(blob);
                    const img = new Image();
                    img.onload = () => {
                        try { const d = drawCircle(img); URL.revokeObjectURL(blobURL); resolve(d); }
                        catch(e) { URL.revokeObjectURL(blobURL); resolve(null); }
                    };
                    img.onerror = () => { URL.revokeObjectURL(blobURL); resolve(null); };
                    img.src = blobURL;
                })
                .catch(() => {
                    // Fallback: Image directo (file:// o cuando fetch no disponible)
                    const img = new Image();
                    img.onload = () => { try { resolve(drawCircle(img)); } catch(e) { resolve(null); } };
                    img.onerror = () => resolve(null);
                    img.src = src;
                });
        });
    }

    window.generatePDFReport = async function () {
        // Feedback visual en el botón
        const btn = document.querySelector('.sidebar-pdf-btn');
        const originalHTML = btn ? btn.innerHTML : null;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="sidebar-pdf-btn-icon">⏳</span><span class="sidebar-pdf-btn-text"><span>Generando PDF...</span><span>Por favor espera</span></span>';
        }

        try {
            await _generatePDFReportInternal();
        } catch (err) {
            console.error('[PDF Export] Error:', err);
            alert('Error al generar el PDF: ' + (err.message || err));
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    };

    async function _generatePDFReportInternal() {
        // Validar que hay datos cargados
        const hasData = typeof excelData !== 'undefined' && excelData && 
                       (excelData.accounts.length > 0 || excelData.periodData.length > 0);
        
        if (!hasData && !window.isDemoData) {
            alert('⚠️ No hay datos cargados.\n\nPor favor, carga un archivo Excel con datos o usa los datos de demostración antes de generar el informe PDF.');
            return;
        }

        // Normalizar referencia jsPDF en el momento del clic (cubre CDN fallback tardío)
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF !== 'undefined') {
            window.jspdf = { jsPDF: window.jsPDF };
        }
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            throw new Error('La librería jsPDF no está disponible. Verifica tu conexión a internet y recarga la página.');
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
        const anchorProfiles = computeAnchorProfiles(data);

        // KPIs de portada
        const cm = (typeof calculatedMetrics !== 'undefined' ? calculatedMetrics : null);
        let kpis  = {};
        if (cm && cm.kpis && cm.kpis.mrr) {
            kpis = cm.kpis;
        } else if (yearMetrics.length) {
            const last = yearMetrics[yearMetrics.length - 1];
            kpis = { mrr: last.avgMRR, arr: last.arr, nrr: last.nrr, churn: last.churnRate, nps: last.nps };
        }

        const years = [...new Set(data.periodData.map(p => (p.Period||'').split('-')[0]))].filter(Boolean).sort();
        const authorPhoto = await loadImageAsDataURL('tamara-profile.jpg');

        /* ── PÁGINA 0: PORTADA PRINCIPAL ──────────────────────────────────── */

        // Fondo completo azul marino (idéntico a portadas de sección)
        doc.setFillColor(22, 40, 90);
        doc.rect(0, 0, PW, PH, 'F');

        // Línea fina decorativa
        doc.setFillColor(80, 120, 200);
        doc.rect(M, PH * 0.36, 40, 0.8, 'F');

        // Título principal
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.text('Customer Success', M, PH * 0.36 + 14);
        doc.text('Analytics', M, PH * 0.36 + 14 + 13);

        // Subtítulo
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(140, 175, 230);
        doc.text('Informe Completo de An\u00e1lisis', M, PH * 0.36 + 14 + 13 + 10);

        // ── Footer rediseñado ─────────────────────────────────────────────
        const p0FooterH  = 38;
        const p0FooterY  = PH - p0FooterH;

        // Banda footer ligeramente más clara que el fondo
        doc.setFillColor(28, 50, 105);
        doc.rect(0, p0FooterY, PW, p0FooterH, 'F');

        // Línea separadora superior sutil
        doc.setFillColor(60, 100, 180);
        doc.rect(0, p0FooterY, PW, 0.6, 'F');

        // — Lado izquierdo: foto + nombre + título —
        const p0PhotoSize = 18;
        const p0PhotoX    = M;
        const p0PhotoCY   = p0FooterY + p0FooterH / 2;
        const p0LinkedIn  = 'https://www.linkedin.com/in/tamarasanchezdiaz';
        if (authorPhoto) {
            try {
                doc.addImage(authorPhoto, 'PNG', p0PhotoX, p0PhotoCY - p0PhotoSize / 2, p0PhotoSize, p0PhotoSize);
            } catch(e) {}
        }
        // Enlace clickable sobre la foto
        doc.link(p0PhotoX, p0PhotoCY - p0PhotoSize / 2, p0PhotoSize, p0PhotoSize, { url: p0LinkedIn });

        const p0TextX = M + p0PhotoSize + 5;
        doc.setTextColor(220, 235, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Tamara Sánchez Díaz', p0TextX, p0PhotoCY - 4);
        // Enlace clickable sobre el nombre
        doc.link(p0TextX, p0PhotoCY - 9, doc.getTextWidth('Tamara Sánchez Díaz'), 6, { url: p0LinkedIn });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(140, 175, 230);
        doc.text('Customer Success Specialist', p0TextX, p0PhotoCY + 3);

        // Separador vertical central
        doc.setFillColor(50, 80, 150);
        doc.rect(PW / 2 - 0.2, p0FooterY + 7, 0.4, p0FooterH - 14, 'F');

        // — Lado derecho: fila superior (Cuentas · En riesgo · Periodos) + fila inferior (Fecha) —
        const p0RightX = PW / 2 + 10;
        const p0RightW = PW - M - p0RightX;
        const periodStr = years.length ? years[0] + ' \u2013 ' + years[years.length - 1] : 'N/A';
        const metaTop = [
            { label: 'Cuentas',   value: String(data.accounts.length) },
            { label: 'En riesgo', value: String(atRisk.length) },
            { label: 'Periodos',  value: periodStr },
        ];
        const mgColW = p0RightW / 3;
        const rowTop = p0FooterY + 10;
        metaTop.forEach((item, i) => {
            const mx = p0RightX + i * mgColW;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(200, 220, 255);
            doc.text(item.value, mx, rowTop);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(80, 120, 180);
            doc.text(item.label.toUpperCase(), mx, rowTop + 5);
        });
        // Fila inferior: Fecha centrada
        const rowBot = p0FooterY + 26;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(200, 220, 255);
        doc.text(dateStr, p0RightX, rowBot);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(80, 120, 180);
        doc.text('FECHA', p0RightX, rowBot + 5);

        /* ── PÁGINA 2: ÍNDICE — PLACEHOLDER (se rellena al final con números reales) ── */
        doc.addPage();
        const tocPageNumber = doc.internal.getNumberOfPages();

        // Variables para tracking de números de página reales (se asignan durante la generación)
        let pgResumen, pgHistorico, pgAncla, pgPlanResumen, pgSalud, pgPlanesStart, pgPlanesEnd;

        /* ── PÁGINA 3: RESUMEN EJECUTIVO ──────────────────────────────────── */
        doc.addPage();
        _pageHeader(doc, PW, M, '   Resumen Ejecutivo');

        // Banner demo
        let yKpi = 32;
        if (isDemo) {
            doc.setFillColor(...COLORS.warning);
            doc.roundedRect(M, yKpi, CW, 9, 2, 2, 'F');
            doc.setTextColor(...COLORS.white);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text('DATOS DE DEMOSTRACIÓN — Carga tu Excel real para obtener tu informe personalizado', M + 4, yKpi + 6);
            yKpi += 14;
        }

        // ── Resultados Globales ───────────────────────────────────────────────
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.text('RESULTADOS GLOBALES', M, yKpi);
        doc.setFillColor(...COLORS.muted);
        doc.rect(M + 52, yKpi - 1, CW - 52, 0.4, 'F');
        yKpi += 5;

        const kpiBoxes = [
            { label: 'MRR',               value: fmtCurrency(kpis.mrr) },
            { label: 'ARR',               value: fmtCurrency(kpis.arr) },
            { label: 'NRR',               value: fmtPct(kpis.nrr)      },
            { label: 'Churn Rate',        value: fmtPct(kpis.churn)    },
            { label: 'NPS',               value: String(Math.round(kpis.nps || 0)) },
            { label: 'Cuentas en Riesgo', value: String(atRisk.length) },
        ];
        const bW = (CW - 10) / 3;
        const bH = 22;
        kpiBoxes.forEach((b, i) => {
            const cx = M + (i % 3) * (bW + 5);
            const cy = yKpi + Math.floor(i / 3) * (bH + 3);
            doc.setFillColor(...COLORS.dark);
            doc.roundedRect(cx, cy, bW, bH, 3, 3, 'F');
            doc.setFillColor(80, 120, 200);
            doc.rect(cx, cy, bW, 1.2, 'F');
            doc.setTextColor(...COLORS.white);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(b.value, cx + bW / 2, cy + 10, { align: 'center' });
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 205, 255);
            doc.text(b.label, cx + bW / 2, cy + bH - 4, { align: 'center' });
        });

        // ── Cuentas Analizadas ────────────────────────────────────────────────
        let yAcc = yKpi + 2 * (bH + 3) + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.text('CUENTAS ANALIZADAS', M, yAcc);
        doc.setFillColor(...COLORS.muted);
        doc.rect(M + 52, yAcc - 1, CW - 52, 0.4, 'F');
        yAcc += 5;

        const colW = (CW - 6) / 2;
        const riskDotColor = am => {
            if (!am) return COLORS.muted;
            return am.riskLevel === 'excellent' ? COLORS.success
                 : am.riskLevel === 'good'      ? [251, 191, 36]
                 : am.riskLevel === 'at-risk'   ? COLORS.orange
                 : COLORS.danger;
        };
        const riskStatusLabel = am => {
            if (!am) return '';
            return am.riskLevel === 'excellent' ? 'Excelente'
                 : am.riskLevel === 'good'      ? 'Bueno'
                 : am.riskLevel === 'at-risk'   ? 'En Riesgo'
                 : 'Crítico';
        };

        const ACC_ROW_H    = 8.5;
        const ACC_PAGE_LIM = PH - 20;
        let accY    = yAcc;      // absolute Y for the current row pair
        let accPair = 0;         // pair index within the current page (for stripe)
        let leftDone = false;    // tracks if left column of a pair was drawn

        const _accPageBreak = () => {
            doc.addPage();
            _pageHeader(doc, PW, M, '   Resumen Ejecutivo — Cuentas Analizadas');
            accY    = 32;
            accPair = 0;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(...COLORS.muted);
            doc.text('CUENTAS ANALIZADAS (cont.)', M, accY);
            doc.setFillColor(...COLORS.muted);
            doc.rect(M + 68, accY - 1, CW - 68, 0.4, 'F');
            accY += 5;
        };

        data.accounts.forEach((acc, i) => {
            const col = i % 2;
            // When starting a new row pair, check if it fits
            if (col === 0) {
                if (accY + ACC_ROW_H > ACC_PAGE_LIM) {
                    _accPageBreak();
                }
                // draw stripe background for the full pair row
                if (accPair % 2 === 0) {
                    doc.setFillColor(...COLORS.light);
                    doc.rect(M, accY - 3.5, CW, ACC_ROW_H, 'F');
                }
            }

            const x  = M + col * (colW + 6);
            const y  = accY;
            const am = accountMetrics.find(a => a.Account_ID === acc.Account_ID);
            const dc = riskDotColor(am);

            doc.setFillColor(...dc);
            doc.circle(x + 2, y - 0.5, 1.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(...COLORS.dark);
            const accName = doc.splitTextToSize(acc.Account_Name || acc.Account_ID, colW - 28);
            doc.text(accName[0], x + 6, y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(...COLORS.muted);
            doc.text(fmtCurrency(parseFloat(acc.MRR_Current) || 0) + ' MRR', x + colW - 1, y, { align: 'right' });
            doc.setFontSize(6);
            doc.setTextColor(...dc);
            doc.text(riskStatusLabel(am), x + 6, y + 3.2);

            // Advance Y only after the right column (or last account)
            if (col === 1 || i === data.accounts.length - 1) {
                accY += ACC_ROW_H;
                accPair++;
            }
        });

        /* ── EVOLUCIÓN HISTÓRICA ─────────────────────────────────────────── */
        if (yearMetrics.length > 0) {
            doc.addPage();
            pgHistorico = doc.internal.getNumberOfPages();
            _sectionCover(doc, PW, PH, M, CW, '01', 'Evolución Histórica de Métricas', 'Análisis de tendencias · MRR, ARR, NRR, Churn y NPS');
            doc.addPage();
            _pageHeader(doc, PW, M, '   Evolución Histórica de Métricas');

            doc.autoTable({
                startY: 32,
                head: [['Año', 'MRR Medio', 'ARR', 'NRR', 'Churn', 'NPS', 'Estado']],
                body: yearMetrics.map(m => {
                    const st = m.nrr >= 100 && m.churnRate < 10 ? 'Saludable' : m.nrr >= 97 ? 'Regular' : 'Crítico';
                    return [m.year, fmtCurrency(m.avgMRR), fmtCurrency(m.arr), fmtPct(m.nrr), fmtPct(m.churnRate), String(m.nps), st];
                }),
                styles:          { fontSize: 9, cellPadding: 4, textColor: COLORS.dark },
                headStyles:      { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
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
                doc.setFillColor(...COLORS.dark);
                doc.roundedRect(M, fy, 1.5, 26, 1, 1, 'F');
                doc.setTextColor(...COLORS.dark);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('Resumen de Crecimiento', M + 8, fy + 9);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.text(`Crecimiento total MRR: +${growthPct}%   |   CAGR: ${cagr}%   |   De ${fmtCurrency(f.avgMRR)} a ${fmtCurrency(l.avgMRR)}`, M + 8, fy + 20);
            }
        }

        /* ── CUENTAS ANCLA ───────────────────────────────────────────────── */
        if (anchorProfiles.length > 0) {
            doc.addPage();
            pgAncla = doc.internal.getNumberOfPages();
            _sectionCover(doc, PW, PH, M, CW, '02', 'Cuentas Ancla — Motor Financiero', 'Ranking de estabilidad · Longevidad · Valor económico');
            doc.addPage();
            _pageHeader(doc, PW, M, '   Cuentas Ancla — Motor Financiero');

            const fmtShort = v => v >= 1000000 ? (v/1000000).toFixed(1)+'M €' : v >= 1000 ? Math.round(v/1000)+'K €' : Math.round(v)+' €';
            const maxYrsA  = Math.max(...anchorProfiles.map(p => p.yearsActive));
            const topMRRA  = anchorProfiles.reduce((m,p) => p.mrrAcc > m ? p.mrrAcc : m, 0);
            const eliteN   = anchorProfiles.filter(p => p.finalScore >= 80).length;

            const ancKPIs = [
                { label:'Cuentas analizadas',    value: String(anchorProfiles.length), color: COLORS.primary },
                { label:'MRR acum. (top cuenta)',value: fmtShort(topMRRA),             color: COLORS.warning },
                { label:'Años permanencia máx.', value: maxYrsA+' años',              color: COLORS.success },
                { label:'Cuentas Élite (>80)',   value: String(eliteN),                color: COLORS.purple  },
            ];
            const kpiW4 = (CW-15)/4;
            ancKPIs.forEach((k,i) => {
                const x = M + i*(kpiW4+5);
                doc.setFillColor(...k.color);
                doc.roundedRect(x,30,kpiW4,20,3,3,'F');
                doc.setTextColor(...COLORS.white);
                doc.setFont('helvetica','bold'); doc.setFontSize(11);
                doc.text(k.value, x+kpiW4/2, 43, {align:'center'});
                doc.setFontSize(5.5); doc.setFont('helvetica','normal');
                doc.text(k.label, x+kpiW4/2, 48, {align:'center'});
            });

            const byMrr    = anchorProfiles.slice().sort((a,b)=>b.mrrAcc-a.mrrAcc).slice(0,5);
            const byLoyal  = anchorProfiles.slice().sort((a,b)=>b.yearsActive-a.yearsActive||b.mrrCurrent-a.mrrCurrent).slice(0,5);
            const byNPS    = anchorProfiles.slice().sort((a,b)=>b.avgNPS-a.avgNPS).slice(0,5);
            const byGrowth = anchorProfiles.slice().sort((a,b)=>b.expansion-a.expansion).slice(0,5);
            const rLbl     = i => i===0?'1.':i===1?'2.':i===2?'3.':String(i+1)+'.';
            const halfW    = (CW-6)/2;

            doc.autoTable({
                startY:56, head:[['Top MRR Acumulado','MRR Acum.','Actual']],
                body: byMrr.map((p,i)=>[rLbl(i)+' '+p.name, fmtShort(p.mrrAcc), fmtShort(p.mrrCurrent)]),
                styles:{fontSize:7.5,cellPadding:2.5}, headStyles:{fillColor:[30,64,175],textColor:COLORS.white,fontStyle:'bold',fontSize:7.5},
                alternateRowStyles:{fillColor:COLORS.light}, margin:{left:M,right:M+halfW+6}, tableWidth:halfW,
            });
            const y1 = doc.lastAutoTable.finalY;
            doc.autoTable({
                startY:56, head:[['Mayor Longevidad','Años','MRR/mes']],
                body: byLoyal.map((p,i)=>[rLbl(i)+' '+p.name, String(p.yearsActive), fmtShort(p.mrrCurrent)]),
                styles:{fontSize:7.5,cellPadding:2.5}, headStyles:{fillColor:[6,95,70],textColor:COLORS.white,fontStyle:'bold',fontSize:7.5},
                alternateRowStyles:{fillColor:COLORS.light}, margin:{left:M+halfW+6,right:M}, tableWidth:halfW,
            });
            const y2 = doc.lastAutoTable.finalY;
            const yMid = Math.max(y1,y2)+5;

            doc.autoTable({
                startY:yMid, head:[['NPS Champions','NPS Medio','MRR']],
                body: byNPS.map((p,i)=>[rLbl(i)+' '+p.name, p.avgNPS.toFixed(1), fmtShort(p.mrrCurrent)]),
                styles:{fontSize:7.5,cellPadding:2.5}, headStyles:{fillColor:[120,53,15],textColor:COLORS.white,fontStyle:'bold',fontSize:7.5},
                alternateRowStyles:{fillColor:COLORS.light}, margin:{left:M,right:M+halfW+6}, tableWidth:halfW,
            });
            const y3 = doc.lastAutoTable.finalY;
            doc.autoTable({
                startY:yMid, head:[['Motor de Expansión','Expansión acum.','NRR']],
                body: byGrowth.map((p,i)=>[rLbl(i)+' '+p.name, '+'+fmtShort(p.expansion), p.nrr.toFixed(0)+'%']),
                styles:{fontSize:7.5,cellPadding:2.5}, headStyles:{fillColor:[76,29,149],textColor:COLORS.white,fontStyle:'bold',fontSize:7.5},
                alternateRowStyles:{fillColor:COLORS.light}, margin:{left:M+halfW+6,right:M}, tableWidth:halfW,
            });
            const y4 = doc.lastAutoTable.finalY;

            const yRank = Math.max(y3,y4)+8;
            doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...COLORS.dark);
            doc.text('Ranking Global — Índice de Estabilidad & Valor', M, yRank);
            const catLbl = p => p.finalScore>=80?'Élite':p.finalScore>=65?'Senior':p.yearsActive>=5?'Creciente':'En desarrollo';
            doc.autoTable({
                startY: yRank+4,
                head:[['#','Cuenta','Segmento','MRR Actual','MRR Acum.','Años','NPS','NRR','Estab.','Cat.']],
                body: anchorProfiles.map((p,i)=>[
                    String(i+1), p.name, p.segment,
                    fmtShort(p.mrrCurrent), fmtShort(p.mrrAcc),
                    String(p.yearsActive), p.avgNPS.toFixed(1),
                    p.nrr.toFixed(0)+'%', String(p.finalScore)+'/100', catLbl(p),
                ]),
                styles:{fontSize:7,cellPadding:2,textColor:COLORS.dark},
                headStyles:{fillColor:COLORS.dark,textColor:COLORS.white,fontStyle:'bold',fontSize:7},
                alternateRowStyles:{fillColor:COLORS.light},
                columnStyles:{0:{cellWidth:8,halign:'center'},1:{fontStyle:'bold',cellWidth:28},8:{halign:'center'}},
                margin:{left:M,right:M},
            });
        }

        /* ── PLAN DE ACTUACIÓN — RESUMEN ─────────────────────────────────── */
        {
            doc.addPage();
            pgPlanResumen = doc.internal.getNumberOfPages();
            _sectionCover(doc, PW, PH, M, CW, '03', 'Plan de Actuación — Resumen', 'Cuentas con Health Score < 60 · Factores de riesgo · Acciones');
            doc.addPage();
            _pageHeader(doc, PW, M, '   Plan de Actuación — Cuentas en Riesgo');

            if (atRisk.length === 0) {
                doc.setFont('helvetica','italic'); doc.setFontSize(10); doc.setTextColor(...COLORS.muted);
                doc.text('No se han detectado cuentas en riesgo. Todas las cuentas tienen Health Score ≥ 60.', M, 45);
            } else {
                // Summary badges
                const critN    = atRisk.filter(a=>a.healthScore<40).length;
                const atRiskN  = atRisk.filter(a=>a.healthScore>=40&&a.healthScore<60).length;
                const mrrRisk  = atRisk.reduce((s,a)=>s+(parseFloat(a.MRR_Current)||0),0);
                const fmtS     = v => v>=1000000?(v/1000000).toFixed(1)+'M €':v>=1000?Math.round(v/1000)+'K €':Math.round(v)+' €';
                const badges   = [
                    {label:'Cuentas Críticas (<40)',  value:String(critN),     color:COLORS.danger},
                    {label:'Cuentas En Riesgo (40-59)',value:String(atRiskN),  color:COLORS.orange},
                    {label:'MRR Total en Riesgo',     value:fmtS(mrrRisk),    color:COLORS.warning},
                ];
                const bW3 = (CW-10)/3;
                badges.forEach((b,i)=>{
                    const x = M+i*(bW3+5);
                    doc.setFillColor(...b.color);
                    doc.roundedRect(x,30,bW3,18,3,3,'F');
                    doc.setTextColor(...COLORS.white);
                    doc.setFont('helvetica','bold'); doc.setFontSize(11);
                    doc.text(b.value, x+bW3/2,43,{align:'center'});
                    doc.setFontSize(6); doc.setFont('helvetica','normal');
                    doc.text(b.label, x+bW3/2,49,{align:'center'});
                });

                // Action plan table
                const factors = a => {
                    const f=[];
                    const c=a.healthComponents||{};
                    if ((c.usage||0)<40)    f.push('Uso bajo ('+(c.usage||0)+'%)');
                    if ((c.tickets||0)>5)  f.push('Tickets: '+(c.tickets||0));
                    if ((c.nps||0)<6)      f.push('NPS bajo ('+(c.nps||0)+'/10)');
                    if ((c.adoption||0)<40) f.push('Adopción baja ('+(c.adoption||0)+'%)');
                    return f.length ? f.join(' · ') : 'Revisión preventiva';
                };
                const action = a => {
                    const hs=a.healthScore;
                    if (hs<40) return 'Llamada ejecutiva urgente (48h) · Escalada interna · War room técnica si >5 tickets';
                    if (hs<50) return 'Check-in semanal · Sesión formación · Revisión tickets · Entrevista NPS 1:1';
                    return 'Seguimiento proactivo · Identificar quick win 30 días · Mapear expansión';
                };
                const priority = a => a.healthScore<40?'Urgente':a.healthScore<50?'Alta':'Media';
                const prioColor = a => a.healthScore<40?COLORS.danger:a.healthScore<50?COLORS.orange:COLORS.warning;

                doc.autoTable({
                    startY: 56,
                    head:[['Cuenta','Segmento','Health','MRR','Factores de Riesgo','Acciones Recomendadas','Prioridad']],
                    body: atRisk.sort((a,b)=>a.healthScore-b.healthScore).map(a=>[
                        a.Account_Name||a.Account_ID,
                        a.Segment||a.Type||'—',
                        String(a.healthScore)+'/100',
                        fmtS(parseFloat(a.MRR_Current)||0),
                        factors(a),
                        action(a),
                        priority(a),
                    ]),
                    styles:{fontSize:7,cellPadding:2.5,textColor:COLORS.dark,overflow:'linebreak'},
                    headStyles:{fillColor:COLORS.dark,textColor:COLORS.white,fontStyle:'bold',fontSize:7},
                    alternateRowStyles:{fillColor:COLORS.light},
                    columnStyles:{
                        0:{fontStyle:'bold',cellWidth:28},
                        1:{cellWidth:18},
                        2:{cellWidth:16,halign:'center'},
                        3:{cellWidth:18},
                        4:{cellWidth:30},
                        5:{cellWidth:45},
                        6:{cellWidth:16,halign:'center'},
                    },
                    didDrawCell: (data) => {
                        if (data.column.index===6 && data.section==='body') {
                            const acc = atRisk.sort((a,b)=>a.healthScore-b.healthScore)[data.row.index];
                            if (acc) {
                                const col = prioColor(acc);
                                doc.setFillColor(...col);
                                doc.roundedRect(data.cell.x+1, data.cell.y+1, data.cell.width-2, data.cell.height-2, 1,1,'F');
                                doc.setTextColor(...COLORS.white);
                                doc.setFont('helvetica','bold'); doc.setFontSize(6.5);
                                doc.text(priority(acc), data.cell.x+data.cell.width/2, data.cell.y+data.cell.height/2+2,{align:'center'});
                            }
                        }
                    },
                    margin:{left:M,right:M},
                });
            }
        }

        /* ── ANÁLISIS DE CUENTAS ──────────────────────────────────────────── */
        doc.addPage();
        pgSalud = doc.internal.getNumberOfPages();
        _sectionCover(doc, PW, PH, M, CW, '04', 'Análisis de Salud de Cuentas', 'Health Score · Adopción · Nivel de riesgo');
        doc.addPage();
        _pageHeader(doc, PW, M, '   An\u00e1lisis de Salud de Cuentas');

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
            { label: 'Crítico (<40)',    count: rc.critical,  color: COLORS.danger   },
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

        const riskLabel = { excellent: 'Excelente', good: 'Bueno', 'at-risk': 'En Riesgo', critical: 'Crítico' };
        doc.autoTable({
            startY: 56,
            head: [['Cuenta', 'MRR', 'Health', 'Uso', 'Adopción', 'Tickets', 'NPS Resp.', 'Riesgo', 'CSM']],
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
                headStyles:         { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: COLORS.light },
            columnStyles:       { 0: { fontStyle: 'bold', cellWidth: 32 }, 2: { cellWidth: 20 }, 7: { cellWidth: 22 } },
            margin:             { left: M, right: M },
        });

        /* ── PLANES DE ACCIÓN ─────────────────────────────────────────────── */
        if (atRisk.length > 0) {
            doc.addPage();
            pgPlanesStart = doc.internal.getNumberOfPages();
            _sectionCover(doc, PW, PH, M, CW, '05', 'Planes de Acción Detallados', 'Estrategia detallada para cuentas en riesgo o estado crítico');
        }
        atRisk.forEach((account, idx) => {
            const plan        = buildPlan(account);
            const isCritical  = account.riskLevel === 'critical';
            const headerColor = isCritical ? COLORS.danger : COLORS.orange;
            const comp = account.healthComponents || {};
            const tixNum = comp.tickets != null ? comp.tickets : (account.Open_Tickets || 0);

            doc.addPage();
            const pageLabel = '   ' + (account.Account_Name || account.Account_ID) + ' — Plan de Acción';
            _pageHeader(doc, PW, M, pageLabel);

            // ── Ficha resumen de cuenta ──────────────────────────────────────
            doc.setFillColor(...(isCritical ? [255, 245, 245] : [255, 250, 240]));
            doc.roundedRect(M, 28, CW, 30, 3, 3, 'F');
            doc.setFillColor(...headerColor);
            doc.roundedRect(M, 28, 2, 30, 1, 1, 'F');

            // Nombre + Health Score
            doc.setTextColor(...headerColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text((account.Account_Name || account.Account_ID) + '  \u2014  Health Score: ' + account.healthScore + ' / 100', M + 8, 38);

            // Badge nivel de riesgo
            const riskBadgeText = isCritical ? 'CRÍTICO' : 'EN RIESGO';
            const badgeW = 24;
            doc.setFillColor(...headerColor);
            doc.roundedRect(M + CW - badgeW - 2, 29, badgeW, 9, 2, 2, 'F');
            doc.setTextColor(...COLORS.white);
            doc.setFontSize(7);
            doc.text(riskBadgeText, M + CW - badgeW / 2 - 2, 35, { align: 'center' });

            // Métricas clave en una línea
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...COLORS.dark);
            const metrLine = 'MRR: ' + fmtCurrency(account.MRR_Current) +
                '   Uso: ' + (comp.usage || 0) + '%' +
                '   Adopción: ' + (comp.adoption || 0) + '%' +
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
        if (atRisk.length > 0) {
            pgPlanesEnd = doc.internal.getNumberOfPages();
        }

        /* ── DIBUJAR ÍNDICE EN PÁGINA 2 CON NÚMEROS REALES ────────────────── */
        doc.setPage(tocPageNumber);
        _pageHeader(doc, PW, M, '   Índice y Leyenda de Colores');

        const tocEntries = [];
        tocEntries.push({ page: String(pgResumen), color: COLORS.dark, title: 'Resumen Ejecutivo', desc: 'KPIs principales, cuentas analizadas y resultados globales' });
        if (pgHistorico)
            tocEntries.push({ page: String(pgHistorico), color: COLORS.dark, title: 'Evolución Histórica de Métricas', desc: 'MRR, ARR, NRR, Churn y NPS por año' });
        if (pgAncla)
            tocEntries.push({ page: String(pgAncla), color: COLORS.warning, title: 'Cuentas Ancla — Motor Financiero', desc: 'Ranking de estabilidad, longevidad y valor económico por cuenta' });
        if (pgPlanResumen)
            tocEntries.push({ page: String(pgPlanResumen), color: COLORS.dark, title: 'Plan de Actuación — Resumen', desc: 'Cuentas con Health Score < 60: factores de riesgo y acciones' });
        if (pgSalud)
            tocEntries.push({ page: String(pgSalud), color: COLORS.dark, title: 'Análisis de Salud de Cuentas', desc: 'Health Score, adopción y nivel de riesgo de cada cuenta' });
        if (pgPlanesStart && pgPlanesEnd) {
            tocEntries.push({ 
                page: pgPlanesStart + '-' + pgPlanesEnd, 
                color: COLORS.dark, 
                title: 'Planes de Acción Detallados', 
                desc: atRisk.length + ' cuentas con estrategia CS individualizada y metodología completa' 
            });
        }

        // Dibujar índice
        let yIdx = 34;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...COLORS.dark);
        doc.text('Índice de Contenidos', M, yIdx);
        yIdx += 2;

        tocEntries.forEach((entry, i) => {
            const indentX = entry.indent ? 10 : 0;
            yIdx += entry.isSection ? 11 : 9;
            if (i % 2 === 0) {
                doc.setFillColor(245, 247, 252);
                doc.rect(M, yIdx - 5, CW, entry.isSection ? 11 : 9, 'F');
            }
            doc.setFillColor(...entry.color);
            if (entry.isSection) {
                doc.roundedRect(M + indentX, yIdx - 4, 4, entry.isSection ? 7 : 5, 1, 1, 'F');
            } else {
                doc.circle(M + indentX + 2.5, yIdx - 0.8, 1.5, 'F');
            }
            doc.setFont('helvetica', entry.isSection ? 'bold' : 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...entry.color);
            doc.text('Pag. ' + entry.page, M + indentX + 7, yIdx);
            doc.setTextColor(...COLORS.dark);
            doc.setFont('helvetica', entry.isSection ? 'bold' : 'normal');
            doc.setFontSize(entry.isSection ? 9 : 8.5);
            doc.text(entry.title, M + indentX + 26, yIdx);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...COLORS.muted);
            doc.text(entry.desc, M + indentX + 26, yIdx + 3.8);
            yIdx += entry.isSection ? 4 : 3;
        });

        // Leyenda de colores
        yIdx += 14;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...COLORS.dark);
        doc.text('Leyenda de Colores', M, yIdx);
        yIdx += 2;

        const legend = [
            { color: COLORS.primary,  name: 'Azul',    use: 'KPIs principales, cabeceras de tabla y secciones de navegacion' },
            { color: COLORS.success,  name: 'Verde',   use: 'Resultados positivos y cuentas en estado Excelente (Health ≥ 80)' },
            { color: [251, 191, 36],  name: 'Amarillo',use: 'Cuentas en estado Bueno (Health 60-79), advertencias leves' },
            { color: COLORS.orange,   name: 'Naranja', use: 'Cuentas En Riesgo (Health 40-59), atencion recomendada' },
            { color: COLORS.danger,   name: 'Rojo',    use: 'Cuentas en estado Crítico (Health < 40), acción urgente' },
            { color: COLORS.purple,   name: 'Morado',  use: 'Métricas de engagement y actividad del producto' },
            { color: COLORS.dark,     name: 'Marino',  use: 'Cabeceras de secciones, portadas y elementos estructurales' },
            { color: COLORS.muted,    name: 'Gris',    use: 'Textos secundarios, etiquetas y datos de contexto' },
        ];

        legend.forEach((l, i) => {
            yIdx += 9;
            if (i % 2 === 0) {
                doc.setFillColor(245, 247, 252);
                doc.rect(M, yIdx - 5, CW, 9, 'F');
            }
            doc.setFillColor(...l.color);
            doc.roundedRect(M, yIdx - 4, 6, 5.5, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...l.color);
            doc.text(l.name, M + 10, yIdx);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.dark);
            doc.text(l.use, M + 36, yIdx);
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

        // Descarga robusta compatible con file://, servidores y navegadores modernos
        try {
            const pdfBlob = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            const tempLink = document.createElement('a');
            tempLink.href = blobUrl;
            tempLink.download = fname;
            tempLink.style.display = 'none';
            document.body.appendChild(tempLink);
            tempLink.click();
            setTimeout(() => {
                document.body.removeChild(tempLink);
                URL.revokeObjectURL(blobUrl);
            }, 3000);
            console.log('[PDF Export] PDF descargado exitosamente:', fname);
        } catch (saveErr) {
            console.error('[PDF Export] Error al guardar:', saveErr);
            // Último recurso: abrir en nueva pestaña como data URI
            const dataUri = doc.output('datauristring');
            const w = window.open(dataUri, '_blank');
            if (!w) {
                alert('El navegador bloqueó la apertura del PDF. Permite ventanas emergentes para este sitio.');
            }
        }
    }

    /* ── HELPER: Calcula perfiles de cuentas ancla ──────────────────────────── */
    function computeAnchorProfiles(data) {
        const yearMap = {};
        data.periodData.forEach(r => { if (r.Period) yearMap[r.Period.split('-')[0]] = 1; });
        const totalYears = Math.max(Object.keys(yearMap).length, 1);

        const profiles = data.accounts.map(acc => {
            const id = String(acc.Account_ID);
            const pd = data.periodData.filter(r => String(r.Account_ID) === id);
            const np = data.npsData.filter(n => String(n.Account_ID) === id);

            const mrrAcc      = pd.reduce((s,r) => s+(parseFloat(r.MRR_Starting)||0), 0);
            const expansion   = pd.reduce((s,r) => s+(parseFloat(r.Expansion_Revenue)||0), 0);
            const contraction = pd.reduce((s,r) => s+(parseFloat(r.Contraction_Revenue)||0), 0);
            const churnRev    = pd.reduce((s,r) => s+(parseFloat(r.Churned_Revenue)||0), 0);
            const nrr         = mrrAcc > 0 ? ((mrrAcc+expansion-contraction-churnRev)/mrrAcc)*100 : 100;

            const yrsMap = {};
            pd.forEach(r => { if (r.Period) yrsMap[r.Period.split('-')[0]] = 1; });
            const yearsActive = Object.keys(yrsMap).length;

            const avgNPS     = np.length > 0 ? np.reduce((s,n)=>s+(parseInt(n.NPS_Response)||0),0)/np.length : 5;
            const stability  = Math.min(Math.round((yearsActive/totalYears)*100*0.4 + (avgNPS/10)*100*0.2 + Math.min(nrr,100)*0.2 + 20), 100);

            return {
                id, name: acc.Account_Name||id,
                segment: acc.Segment||acc.Type||'—',
                csm: acc.CSM_Name||'—',
                mrrCurrent: parseFloat(acc.MRR_Current)||0,
                mrrAcc: Math.round(mrrAcc), expansion: Math.round(expansion),
                yearsActive, avgNPS: Math.round(avgNPS*10)/10,
                nrr: Math.round(nrr*10)/10, stability,
            };
        });

        const maxMRR = Math.max(...profiles.map(p=>p.mrrAcc), 1);
        return profiles
            .map(p => ({ ...p, finalScore: Math.min(Math.round(p.stability*0.6+(p.mrrAcc/maxMRR)*100*0.4), 100) }))
            .sort((a,b) => b.finalScore - a.finalScore);
    }

    /* ── HELPER: cabecera de página ──────────────────────────────────────────── */
    function _pageHeader(doc, PW, M, title) {
        const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFillColor(...COLORS.dark);
        doc.rect(0, 0, PW, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(title, M, 17);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Pag. ' + pageNum, PW - M, 17, { align: 'right' });
    }

    /* ── HELPER: portada de sección ───────────────────────────────────── */
    function _sectionCover(doc, PW, PH, M, CW, numStr, title, subtitle) {
        // Fondo completo azul marino
        doc.setFillColor(22, 40, 90);
        doc.rect(0, 0, PW, PH, 'F');
        // Número grande decorativo (muy oscuro = efecto sutil)
        doc.setTextColor(30, 55, 110);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(130);
        doc.text(numStr, PW - M, PH * 0.72, { align: 'right' });
        // Línea fina decorativa
        doc.setFillColor(80, 120, 200);
        doc.rect(M, PH * 0.42, 40, 0.8, 'F');
        // Título sección
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        const titleLines = doc.splitTextToSize(title, CW * 0.72);
        doc.text(titleLines, M, PH * 0.42 + 14);
        // Subtítulo
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(140, 175, 230);
        doc.text(subtitle, M, PH * 0.42 + 14 + titleLines.length * 12 + 4);
    }

    /* ── HELPER: bloque de sección con titulo coloreado + bullets ───────────── */
    // Devuelve la nueva yPos tras renderizar el bloque
    function _sectionBlock(doc, PW, M, CW, PH, yTop, title, color, items) {
        const lineH   = 5.5;   // altura de línea de texto (mm)
        const padV    = 5;     // padding vertical interior
        const titleH  = 7;     // altura de la barra de titulo
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
            doc.text('Continuación: ' + title, M, 13);
            yTop = 24;
        }

        // Fondo del bloque
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(M, yTop, CW, blockH, 3, 3, 'F');

        // Barra de título
        doc.setFillColor(...color);
        doc.roundedRect(M, yTop, CW, titleH, 2, 2, 'F');
        doc.rect(M, yTop + titleH / 2, CW, titleH / 2, 'F'); // esquinas inferiores rectas
        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(title, M + 5, yTop + 5.2);

        // Barra lateral de acento
        doc.setFillColor(...color);
        doc.rect(M, yTop + titleH, 1.5, blockH - titleH, 'F');

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
