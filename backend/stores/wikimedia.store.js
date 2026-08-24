const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

export class WikimediaStore {
    constructor() {
        this.cached = null;
    }

    async getFeatured() {
        const date = new Date().toISOString().slice(0, 10);
        if (this.cached?.date === date && this.cached.expiresAt > Date.now()) return this.cached.data;

        const [year, month, day] = date.split('-');
        const response = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${year}/${month}/${day}`, {
            headers: {
                accept: 'application/json',
                // Set WIKIMEDIA_USER_AGENT on the Pi to a contactable value for production use.
                'User-Agent': process.env.WIKIMEDIA_USER_AGENT || 'PiKiosk/1.0 (local family information display)',
            },
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`Wikimedia returned ${response.status}`);

        const payload = await response.json();
        const data = {
            date,
            pictureOfTheDay: toPicture(payload.image),
            onThisDay: (payload.onthisday || []).slice(0, 2).map((event) => ({
                year: event.year,
                text: event.text || 'Historical event',
            })),
        };
        this.cached = { date, data, expiresAt: Date.now() + CACHE_TTL_MS };
        return data;
    }
}

function toPicture(image) {
    if (!image) return null;
    return {
        title: textValue(image.displaytitle) || image.title || 'Picture of the day',
        description: textValue(image.description) || image.extract || '',
        image: image.thumbnail?.source || image.originalimage?.source || null,
    };
}

function textValue(value) {
    if (typeof value === 'string') return value.replace(/<[^>]*>/g, '');
    return value?.text || '';
}
