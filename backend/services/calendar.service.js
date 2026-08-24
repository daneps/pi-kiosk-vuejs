import ical from 'node-ical';
import dayjs from 'dayjs';

export class CalendarService {
    /**
     * Inject dependencies via constructor
     * @param {CalendarStore} calendarStore
     */
    constructor(calendarStore) {
        this.calendarStore = calendarStore;
    }

    async getEventsForMonth(yearMonth, sources) {
        const targetMonth = dayjs(yearMonth, 'YYYY-MM', true);
        if (!targetMonth.isValid()) throw new Error('Invalid month; expected YYYY-MM');

        const windowStart = targetMonth.startOf('month').startOf('week');
        const windowEnd = targetMonth.endOf('month').endOf('week');
        const settled = await Promise.allSettled(sources.map((source) => this.calendarStore.getCalendar(source.url)));
        const events = [];
        const errors = [];

        settled.forEach((result, sourceIndex) => {
            if (result.status === 'rejected') {
                console.error(`Unable to load calendar source ${sources[sourceIndex].name}:`, result.reason);
                errors.push({ source: sources[sourceIndex].name, message: 'Calendar could not be loaded.' });
                return;
            }
            Object.values(result.value)
                .filter((item) => item.type === 'VEVENT' && item.start)
                .flatMap((event) => event.rrule ? ical.expandRecurringEvent(event, { from: windowStart.toDate(), to: windowEnd.endOf('day').toDate(), expandOngoing: true }) : [event])
                .filter((event) => {
                    const start = dayjs(event.start);
                    const end = event.end ? dayjs(event.end) : start;
                    return !end.isBefore(windowStart) && !start.isAfter(windowEnd.endOf('day'));
                })
                .forEach((event) => events.push(this.toClientEvent(event, sources[sourceIndex], sourceIndex)));
        });

        events.sort((a, b) => a.start.localeCompare(b.start));
        return { events, errors };
    }

    toClientEvent(event, source, sourceIndex) {
        const allDay = event.datetype === 'date' || event.start?.dateOnly === true;
        const start = dayjs(event.start);
        const end = event.end ? dayjs(event.end) : null;
        const startValue = allDay ? start.format('YYYY-MM-DD') : start.format('YYYY-MM-DD HH:mm');
        return {
            id: `${sourceIndex}:${event.uid || event.summary || 'event'}:${startValue}`,
            title: event.summary || 'Untitled Event', start: startValue,
            end: end ? (allDay ? end.format('YYYY-MM-DD') : end.format('YYYY-MM-DD HH:mm')) : null,
            allDay, description: event.description || '', source: { name: source.name, color: source.color }, sourceIndex,
        };
    }
}
