// server/controllers/calendar.controller.js
export class CalendarController {
    constructor(calendarService) {
        this.calendarService = calendarService;
    }

    // Uses arrow syntax to retain lexical scope context when bound to router instances
    getCalendarEvents = async (req, res) => {
        try {
            const month = typeof req.query.month === 'string' ? req.query.month : null;
            const sourceValues = Array.isArray(req.query.source) ? req.query.source : [req.query.source];
            const sources = sourceValues.filter((source) => typeof source === 'string' && source.length > 0).map((source) => JSON.parse(source));
            if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ error: 'The month query parameter is required (YYYY-MM).' });
            if (!sources.length) return res.status(200).json({ events: [], errors: [] });
            if (sources.length > 10 || sources.some((source) => !this.isCalendarSource(source))) return res.status(400).json({ error: 'Calendar sources require a name, color, and valid HTTP(S) URL (maximum 10).' });
            return res.status(200).json(await this.calendarService.getEventsForMonth(month, sources));
        } catch (error) {
            console.error('CalendarController Error:', error);
            return res.status(400).json({ error: error.message || 'Unable to process calendar data.' });
        }
    }

    isCalendarSource(value) {
        if (!value || typeof value !== 'object' || typeof value.name !== 'string' || typeof value.color !== 'string' || typeof value.url !== 'string') return false;
        try { const url = new URL(value.url); return url.protocol === 'https:' || url.protocol === 'http:'; } catch { return false; }
    }
}
