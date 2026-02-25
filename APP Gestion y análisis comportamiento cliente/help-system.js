// ===== SISTEMA DE AYUDA Y TOOLTIPS =====

function initHelpSystem() {
    // Crear el panel de ayuda si no existe
    if (!document.getElementById('helpPanel')) {
        createHelpPanel();
    }
    
    // Evento para el botón flotante
    const helpButton = document.getElementById('helpButton');
    const helpPanel = document.getElementById('helpPanel');
    const helpOverlay = document.getElementById('helpOverlay');
    const helpCloseBtn = document.getElementById('helpCloseBtn');
    
    if (helpButton) {
        helpButton.addEventListener('click', openHelpPanel);
    }
    
    if (helpCloseBtn) {
        helpCloseBtn.addEventListener('click', closeHelpPanel);
    }
    
    if (helpOverlay) {
        helpOverlay.addEventListener('click', closeHelpPanel);
    }
    
    // Inicializar tooltips dinámicos
    initDynamicTooltips();
}

// ===== TOOLTIPS DINÁMICOS =====
function initDynamicTooltips() {
    // Crear contenedor de tooltip si no existe
    let tooltipContainer = document.getElementById('dynamicTooltip');
    if (!tooltipContainer) {
        tooltipContainer = document.createElement('div');
        tooltipContainer.id = 'dynamicTooltip';
        tooltipContainer.className = 'dynamic-tooltip';
        document.body.appendChild(tooltipContainer);
    }
    
    // Agregar eventos a todos los iconos de info
    document.querySelectorAll('.info-icon').forEach(icon => {
        icon.addEventListener('mouseenter', showDynamicTooltip);
        icon.addEventListener('mouseleave', hideDynamicTooltip);
        icon.addEventListener('mousemove', updateTooltipPosition);
    });
}

function showDynamicTooltip(event) {
    const icon = event.currentTarget;
    const tooltipText = icon.getAttribute('data-tooltip');
    const tooltip = document.getElementById('dynamicTooltip');
    
    if (!tooltipText || !tooltip) return;
    
    tooltip.textContent = tooltipText;
    tooltip.style.display = 'block';
    
    // Posicionar el tooltip
    updateTooltipPosition(event);
    
    // Mostrar con animación
    setTimeout(() => {
        tooltip.classList.add('visible');
    }, 10);
}

function hideDynamicTooltip() {
    const tooltip = document.getElementById('dynamicTooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 200);
    }
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('dynamicTooltip');
    if (!tooltip || tooltip.style.display === 'none') return;
    
    const icon = event.currentTarget;
    const rect = icon.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Calcular posición centrada arriba del icono
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 10;
    
    // Ajustar si se sale por la izquierda
    if (left < 10) {
        left = 10;
    }
    
    // Ajustar si se sale por la derecha
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    
    // Si se sale por arriba, mostrar abajo
    if (top < 10) {
        top = rect.bottom + 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function createHelpPanel() {
    const helpHTML = `
        <!-- Overlay -->
        <div id="helpOverlay" class="help-overlay"></div>
        
        <!-- Botón flotante de ayuda -->
        <button id="helpButton" class="help-button" title="Ayuda">
            💡
        </button>
        
        <!-- Panel de ayuda -->
        <div id="helpPanel" class="help-panel">
            <div class="help-panel-header">
                <h2>📚 Guía de Métricas</h2>
                <button id="helpCloseBtn" class="help-close-btn">✕</button>
            </div>
            <div class="help-panel-content">
                
                <!-- Sección: Métricas de Revenue -->
                <div class="help-section">
                    <h3 class="help-section-title">💰 Métricas de Ingresos</h3>
                    
                    <div class="help-metric">
                        <div class="help-metric-name">
                            <span class="help-metric-icon">💵</span>
                            MRR
                        </div>
                        <div class="help-metric-full">Monthly Recurring Revenue (Ingresos Recurrentes Mensuales)</div>
                        <div class="help-metric-description">
                            Es el dinero que tu empresa recibe <strong>cada mes</strong> de forma predecible por suscripciones o contratos activos.
                        </div>
                        <div class="help-metric-example">
                            <strong>Ejemplo:</strong> Si tienes 10 clientes pagando $1,000/mes cada uno, tu MRR es $10,000.
                        </div>
                        <div class="help-metric-interpretation">
                            <strong>¿Por qué es importante?</strong>
                            <ul>
                                <li>Te ayuda a predecir ingresos futuros</li>
                                <li>Es la métrica base para medir crecimiento</li>
                                <li>Los inversores la usan para valorar tu empresa</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="help-metric">
                        <div class="help-metric-name">
                            <span class="help-metric-icon">📅</span>
                            ARR
                        </div>
                        <div class="help-metric-full">Annual Recurring Revenue (Ingresos Recurrentes Anuales)</div>
                        <div class="help-metric-description">
                            Es tu MRR multiplicado por 12. Representa los ingresos anuales si <strong>todo sigue igual</strong> durante un año.
                        </div>
                        <div class="help-metric-example">
                            <strong>Cálculo:</strong> ARR = MRR × 12<br>
                            Si tu MRR es $10,000 → ARR = $120,000
                        </div>
                        <div class="help-metric-interpretation">
                            <strong>¿Cuándo es útil?</strong>
                            <ul>
                                <li>Para comunicar con inversores y junta directiva</li>
                                <li>Planificación de presupuesto anual</li>
                                <li>Comparar con otras empresas del sector</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Sección: Métricas de Retención -->
                <div class="help-section">
                    <h3 class="help-section-title">🔄 Métricas de Retención</h3>
                    
                    <div class="help-metric">
                        <div class="help-metric-name">
                            <span class="help-metric-icon">📈</span>
                            NRR
                        </div>
                        <div class="help-metric-full">Net Revenue Retention (Retención Neta de Ingresos)</div>
                        <div class="help-metric-description">
                            Mide cuánto dinero <strong>retuviste Y creciste</strong> de tus clientes existentes, sin contar nuevos clientes.
                        </div>
                        <div class="help-metric-example">
                            <strong>Ejemplo:</strong><br>
                            • Ingresos iniciales: $100,000<br>
                            • Expansiones (upgrades): +$15,000<br>
                            • Contracciones (downgrades): -$5,000<br>
                            • Pérdidas (churn): -$5,000<br>
                            <strong>NRR = 105%</strong> ($105,000 / $100,000)
                        </div>
                        <div class="help-metric-interpretation">
                            <strong>¿Cómo interpretarlo?</strong>
                            <ul>
                                <li><strong>NRR > 100%:</strong> 🎉 Excelente! Estás creciendo orgánicamente</li>
                                <li><strong>NRR = 100%:</strong> ✅ Bien. Retienes todo sin pérdidas</li>
                                <li><strong>NRR < 100%:</strong> ⚠️ Estás perdiendo ingresos de base existente</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="help-metric">
                        <div class="help-metric-name">
                            <span class="help-metric-icon">👋</span>
                            Churn Rate
                        </div>
                        <div class="help-metric-full">Tasa de Abandono</div>
                        <div class="help-metric-description">
                            Porcentaje de clientes que <strong>cancelaron o dejaron de pagar</strong> en un período determinado.
                        </div>
                        <div class="help-metric-example">
                            <strong>Cálculo:</strong><br>
                            • Clientes al inicio del mes: 100<br>
                            • Clientes que cancelaron: 5<br>
                            <strong>Churn = 5%</strong> (5 / 100)
                        </div>
                        <div class="help-metric-interpretation">
                            <strong>Benchmarks SaaS:</strong>
                            <ul>
                                <li><strong>< 5%:</strong> 🟢 Excelente retención</li>
                                <li><strong>5-10%:</strong> 🟡 Aceptable, hay margen de mejora</li>
                                <li><strong>10-15%:</strong> 🟠 Preocupante, requiere acción</li>
                                <li><strong>> 15%:</strong> 🔴 Crítico, problema de producto o servicio</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Sección: Métricas de Satisfacción -->
                <div class="help-section">
                    <h3 class="help-section-title">⭐ Métricas de Satisfacción</h3>
                    
                    <div class="help-metric">
                        <div class="help-metric-name">
                            <span class="help-metric-icon">🎯</span>
                            NPS
                        </div>
                        <div class="help-metric-full">Net Promoter Score (Puntuación Neta del Promotor)</div>
                        <div class="help-metric-description">
                            Mide la <strong>lealtad y satisfacción</strong> de tus clientes preguntando: "¿Qué tan probable es que recomiendes nuestro producto?" (escala 0-10).
                        </div>
                        <div class="help-metric-example">
                            <strong>Clasificación:</strong><br>
                            • 9-10: Promotores 😍 (te recomendarán)<br>
                            • 7-8: Pasivos 😐 (satisfechos pero no entusiastas)<br>
                            • 0-6: Detractores 😤 (insatisfechos)<br>
                            <br>
                            <strong>Cálculo:</strong> NPS = % Promotores - % Detractores
                        </div>
                        <div class="help-metric-interpretation">
                            <strong>¿Cómo interpretarlo?</strong>
                            <ul>
                                <li><strong>NPS > 50:</strong> 🎉 Excelente! Tienes fans leales</li>
                                <li><strong>NPS 30-50:</strong> 👍 Bueno, mayoría satisfecha</li>
                                <li><strong>NPS 0-30:</strong> 😐 Regular, hay insatisfacción</li>
                                <li><strong>NPS < 0:</strong> 🚨 Crítico! Más detractores que promotores</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="help-metric">
                        <div class="help-metric-name">
                            <span class="help-metric-icon">💚</span>
                            Health Score
                        </div>
                        <div class="help-metric-full">Puntuación de Salud de la Cuenta</div>
                        <div class="help-metric-description">
                            Combina múltiples señales para predecir <strong>qué tan saludable está la relación</strong> con cada cliente (0-100).
                        </div>
                        <div class="help-metric-example">
                            <strong>Factores que considera:</strong><br>
                            • Uso del producto (30%)<br>
                            • NPS individual (20%)<br>
                            • Tickets de soporte abiertos (20%)<br>
                            • Engagement/actividad (15%)<br>
                            • Tasa de renovación histórica (15%)
                        </div>
                        <div class="help-metric-interpretation">
                            <strong>Niveles de riesgo:</strong>
                            <ul>
                                <li><strong>80-100:</strong> 🟢 Excelente - Cliente feliz</li>
                                <li><strong>60-79:</strong> 🟡 Bueno - Seguimiento regular</li>
                                <li><strong>40-59:</strong> 🟠 En Riesgo - Requiere atención</li>
                                <li><strong>0-39:</strong> 🔴 Crítico - Intervención urgente</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Sección: Métricas de Riesgo -->
                <div class="help-section">
                    <h3 class="help-section-title">⚠️ Métricas de Riesgo</h3>
                    
                    <div class="help-metric">
                        <div class="help-metric-name">
                            <span class="help-metric-icon">🚨</span>
                            Revenue at Risk
                        </div>
                        <div class="help-metric-full">Ingresos en Riesgo</div>
                        <div class="help-metric-description">
                            Suma del MRR de todas las cuentas con <strong>Health Score menor a 50</strong>. Es el dinero que podrías perder si no actúas.
                        </div>
                        <div class="help-metric-example">
                            <strong>Ejemplo:</strong><br>
                            • Cliente A (Health: 45) - MRR: $3,000<br>
                            • Cliente B (Health: 38) - MRR: $5,000<br>
                            • Cliente C (Health: 85) - MRR: $10,000<br>
                            <strong>Revenue at Risk = $8,000</strong> (solo A y B)
                        </div>
                        <div class="help-metric-interpretation">
                            <strong>¿Qué hacer?</strong>
                            <ul>
                                <li>Priorizar atención a cuentas con mayor MRR en riesgo</li>
                                <li>Asignar recursos de Customer Success</li>
                                <li>Crear planes de acción inmediatos</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Tip final -->
                <div class="help-tip">
                    <div class="help-tip-title">
                        💡 Consejo Pro
                    </div>
                    <div class="help-tip-content">
                        <strong>No mires métricas aisladas:</strong> Un NPS alto pero Churn alto indica que pierdes clientes pese a tener fans. Un NRR alto pero MRR bajo significa buena retención pero problemas de adquisición. Analiza el conjunto completo para tomar decisiones informadas.
                    </div>
                </div>
                
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', helpHTML);
}

function openHelpPanel() {
    const panel = document.getElementById('helpPanel');
    const overlay = document.getElementById('helpOverlay');
    
    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('active');
}

function closeHelpPanel() {
    const panel = document.getElementById('helpPanel');
    const overlay = document.getElementById('helpOverlay');
    
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelpSystem);
} else {
    initHelpSystem();
}
