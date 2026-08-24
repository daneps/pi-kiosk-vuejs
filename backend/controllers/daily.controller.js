export class DailyController {
    constructor(dailyService) { this.dailyService = dailyService; }
    getDaily = async (_req, res) => {
        try { return res.json(await this.dailyService.getDaily()); }
        catch (error) {
            console.error('DailyController Error:', error);
            return res.status(502).json({ error: 'Unable to load daily delights.' });
        }
    }
}
