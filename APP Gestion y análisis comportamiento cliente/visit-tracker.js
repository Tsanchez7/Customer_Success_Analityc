// ===== CONTADOR GLOBAL DE VISITAS (MULTI-USUARIO / MULTI-DISPOSITIVO) =====
(function () {
    const COUNT_API_NAMESPACE = 'customer_success_analityc_app';
    const COUNT_API_KEY = 'total_visitas';
    const START_OFFSET = 1099; // Para que el primer valor visible arranque en 1.100
    const SYNC_INTERVAL_MS = 15000;

    const FALLBACK_LOCAL_KEY = 'cs_analytics_visit_count_fallback';

    function getCounterElement() {
        return document.getElementById('visitCount');
    }

    function getStoredCount() {
        try {
            const raw = localStorage.getItem(FALLBACK_LOCAL_KEY);
            const parsed = Number.parseInt(raw || '', 10);

            if (Number.isFinite(parsed) && parsed >= START_OFFSET) {
                return parsed;
            }
        } catch (error) {
            console.warn('[Visit Tracker] No se pudo leer localStorage:', error);
        }

        return START_OFFSET;
    }

    function setStoredCount(value) {
        if (!Number.isFinite(value) || value < START_OFFSET) {
            return;
        }

        try {
            localStorage.setItem(FALLBACK_LOCAL_KEY, String(Math.floor(value)));
        } catch (error) {
            console.warn('[Visit Tracker] No se pudo guardar en localStorage:', error);
        }
    }

    function formatVisits(value) {
        return Number(value || 0).toLocaleString('es-ES');
    }

    function updateDOM(value) {
        const counterElement = getCounterElement();
        if (counterElement) {
            counterElement.textContent = formatVisits(value);
        }

        window.csGlobalVisitCount = value;
    }

    function applyCount(value, source) {
        const numericValue = Math.floor(Number(value) || START_OFFSET);
        const safeValue = Number.isFinite(numericValue) && numericValue >= START_OFFSET
            ? numericValue
            : START_OFFSET;

        if (source === 'api') {
            setStoredCount(safeValue);
            updateDOM(safeValue);
            return safeValue;
        }

        const currentLocal = getStoredCount();
        const nextValue = Math.max(currentLocal, safeValue);
        setStoredCount(nextValue);
        updateDOM(nextValue);
        return nextValue;
    }

    async function requestCountApi(mode) {
        const action = mode === 'hit' ? 'hit' : 'get';
        const url = `https://api.countapi.xyz/${action}/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}?t=${Date.now()}`;

        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const rawCount = Number(payload && payload.value ? payload.value : 0);

        if (!Number.isFinite(rawCount)) {
            throw new Error('Respuesta inválida de CountAPI');
        }

        return rawCount + START_OFFSET;
    }

    async function incrementGlobalCounter() {
        try {
            const apiTotalCount = await requestCountApi('hit');
            applyCount(apiTotalCount, 'api');
        } catch (error) {
            console.warn('[Visit Tracker] Error al registrar visita global, se mantiene último valor conocido:', error);
            updateDOM(getStoredCount());
        }
    }

    async function syncGlobalCounter() {
        try {
            const apiTotalCount = await requestCountApi('get');
            applyCount(apiTotalCount, 'api');
        } catch (error) {
            console.warn('[Visit Tracker] Error al sincronizar contador global:', error);
        }
    }

    const counterElement = getCounterElement();

    if (!counterElement) {
        return;
    }

    updateDOM(getStoredCount());

    incrementGlobalCounter();
    syncGlobalCounter();

    setInterval(syncGlobalCounter, SYNC_INTERVAL_MS);

    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            syncGlobalCounter();
        }
    });
}());
