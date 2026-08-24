// server/stores/calendar.store.js
import ical from 'node-ical';

const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5 * 60 * 1_000;

export class CalendarStore {
    constructor() {
        this.cache = new Map();
    }

    /** Loads remote calendars and keeps a short-lived cache for the Pi. */
    async getCalendar(url) {
        const cached = this.cache.get(url);
        if (cached && cached.expiresAt > Date.now()) return cached.events;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const events = await ical.async.fromURL(url, {
                headers: { 'User-Agent': 'pi-kiosk-calendar/1.0' },
                signal: controller.signal,
            });
            this.cache.set(url, { events, expiresAt: Date.now() + CACHE_TTL_MS });
            return events;
        } finally {
            clearTimeout(timer);
        }
    }
}
