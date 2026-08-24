export class WeatherController {
    constructor(weatherService) {
        this.weatherService = weatherService;
    }

    getWeather = async (req, res) => {
        const latitude = Number(req.query.latitude);
        const longitude = Number(req.query.longitude);
        const temperatureUnit = req.query.temperatureUnit === 'celsius' ? 'celsius' : 'fahrenheit';
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ error: 'Valid latitude and longitude query parameters are required.' });
        }
        try {
            return res.json(await this.weatherService.getWeather(latitude, longitude, temperatureUnit));
        } catch (error) {
            console.error('WeatherController Error:', error);
            return res.status(502).json({ error: 'Unable to load weather data.' });
        }
    }
}
