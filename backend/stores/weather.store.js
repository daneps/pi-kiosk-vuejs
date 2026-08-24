const CACHE_TTL_MS = 30 * 60 * 1_000;
const ALERT_CACHE_TTL_MS = 5 * 60 * 1_000;

export class WeatherStore {
    constructor() {
        this.cache = new Map();
        this.alertCache = new Map();
    }

    async getForecast(latitude, longitude, temperatureUnit) {
        const key = `${latitude},${longitude},${temperatureUnit}`;
        const cached = this.cache.get(key);
        if (cached && cached.expiresAt > Date.now()) return cached.data;

        const query = new URLSearchParams({
            latitude: String(latitude), longitude: String(longitude), timezone: 'auto', forecast_days: '5', temperature_unit: temperatureUnit,
            current: 'temperature_2m,apparent_temperature,weather_code,is_day',
            hourly: 'temperature_2m,precipitation_probability,weather_code',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: AbortSignal.timeout(10_000) });
        if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);
        const data = await response.json();
        this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
        return data;
    }

    async getAlerts(latitude, longitude) {
        const key = `${latitude},${longitude}`;
        const cached = this.alertCache.get(key);
        if (cached && cached.expiresAt > Date.now()) return cached.data;

        const query = new URLSearchParams({ point: `${latitude},${longitude}` });
        const response = await fetch(`https://api.weather.gov/alerts/active?${query}`, {
            headers: {
                accept: 'application/geo+json',
                'User-Agent': process.env.NWS_USER_AGENT || 'PiKiosk/1.0 (local family information display)',
            },
            signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error(`NWS alerts returned ${response.status}`);

        const alerts = (await response.json()).features
            .map(({ properties }) => ({
                id: properties.id,
                event: properties.event,
                headline: properties.headline || '',
                severity: properties.severity,
                urgency: properties.urgency,
                expires: properties.expires,
            }))
            .sort((first, second) => severityRank(first.severity) - severityRank(second.severity));
        this.alertCache.set(key, { data: alerts, expiresAt: Date.now() + ALERT_CACHE_TTL_MS });
        return alerts;
    }
}

function severityRank(severity) {
    return { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 }[severity] ?? 5;
}
