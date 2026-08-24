export class WeatherService {
    constructor(weatherStore) {
        this.weatherStore = weatherStore;
    }

    async getWeather(latitude, longitude, temperatureUnit) {
        const [forecast, alerts] = await Promise.all([
            this.weatherStore.getForecast(latitude, longitude, temperatureUnit),
            this.weatherStore.getAlerts(latitude, longitude).catch((error) => {
                console.error('Unable to load NWS alerts:', error);
                return [];
            }),
        ]);
        const currentHour = forecast.current?.time?.slice(0, 13);
        const start = Math.max(0, forecast.hourly.time.findIndex((time) => time.startsWith(currentHour)));
        const hourly = forecast.hourly.time.slice(start, start + 12).map((time, index) => ({
            time,
            temperature: forecast.hourly.temperature_2m[start + index],
            precipitationProbability: forecast.hourly.precipitation_probability[start + index],
            weatherCode: forecast.hourly.weather_code[start + index],
        }));
        const daily = forecast.daily.time.slice(0, 5).map((date, index) => {
            const sunrise = forecast.daily.sunrise[index];
            const sunset = forecast.daily.sunset[index];
            return {
                date,
                high: forecast.daily.temperature_2m_max[index],
                low: forecast.daily.temperature_2m_min[index],
                // Open-Meteo's daily code is the most severe condition observed that day.
                // For a kiosk overview, the most common daylight condition is more useful.
                weatherCode: predominantDaytimeWeatherCode(forecast.hourly, date, sunrise, sunset, forecast.daily.weather_code[index]),
                sunrise,
                sunset,
            };
        });

        return {
            timezone: forecast.timezone,
            units: { temperature: forecast.current_units.temperature_2m, precipitation: forecast.hourly_units.precipitation_probability },
            current: { temperature: forecast.current.temperature_2m, feelsLike: forecast.current.apparent_temperature, weatherCode: forecast.current.weather_code, isDay: Boolean(forecast.current.is_day) },
            alerts,
            today: daily[0], hourly, daily,
        };
    }
}

function predominantDaytimeWeatherCode(hourly, date, sunrise, sunset, fallback) {
    const codes = hourly.time.reduce((result, time, index) => {
        if (time.startsWith(date) && time >= sunrise && time <= sunset) result.push(hourly.weather_code[index]);
        return result;
    }, []);
    if (!codes.length) return fallback;

    const counts = new Map();
    for (const code of codes) counts.set(code, (counts.get(code) ?? 0) + 1);
    return [...counts.entries()].sort(([firstCode, firstCount], [secondCode, secondCount]) => secondCount - firstCount || firstCode - secondCode)[0][0];
}
