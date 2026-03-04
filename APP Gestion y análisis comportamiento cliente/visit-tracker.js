// ===== CONTADOR GLOBAL DE VISITAS (MULTI-USUARIO / MULTI-DISPOSITIVO) =====
(function () {
    const COUNT_API_NAMESPACE = 'customer_success_analityc_app';
    const COUNT_API_KEY = 'total_visitas';
    const START_OFFSET = 1099; // Para que el primer valor visible arranque en 1.100

    const FALLBACK_LOCAL_KEY = 'cs_analytics_visit_count_fallback';

    function formatVisits(value) {
        return Number(value || 0).toLocaleString('es-ES');
    }

    function updateDOM(value) {
        const counterElement = document.getElementById('visitCount');
        if (counterElement) {
            counterElement.textContent = formatVisits(value);
        }
    }

    async function incrementGlobalCounter() {
        try {
            const url = `https://api.countapi.xyz/hit/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`;
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            const rawCount = Number(payload && payload.value ? payload.value : 0);
            const totalCount = rawCount + START_OFFSET;

            updateDOM(totalCount);
            window.csGlobalVisitCount = totalCount;
        } catch (error) {
            console.warn('[Visit Tracker] Error en contador global, usando fallback local:', error);

            let fallback = parseInt(localStorage.getItem(FALLBACK_LOCAL_KEY) || String(START_OFFSET), 10);
            fallback += 1;
            localStorage.setItem(FALLBACK_LOCAL_KEY, String(fallback));
            updateDOM(fallback);
        }
    }

    incrementGlobalCounter();
}());
