import Parser from 'rss-parser';

const CACHE_TTL_MS = 15 * 60 * 1_000;
const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
        ],
    },
});

export class NewsStore {
    constructor() {
        this.cache = new Map();
    }

    async getFeed(url) {
        const cached = this.cache.get(url);
        if (cached && cached.expiresAt > Date.now()) return cached.feed;
        const feed = await parser.parseURL(url);
        this.cache.set(url, { feed, expiresAt: Date.now() + CACHE_TTL_MS });
        return feed;
    }
}
