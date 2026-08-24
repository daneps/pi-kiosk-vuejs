export class NewsService {
    constructor(newsStore) {
        this.newsStore = newsStore;
    }

    async getHeadlines(sources) {
        const results = await Promise.allSettled(sources.map((source) => this.newsStore.getFeed(source.url)));
        const articles = [];
        const errors = [];

        results.forEach((result, index) => {
            const source = sources[index];
            if (result.status === 'rejected') {
                console.error(`Unable to load news source ${source.name}:`, result.reason);
                errors.push({ source: source.name, message: 'Feed could not be loaded.' });
                return;
            }
            result.value.items.slice(0, 10).forEach((item) => articles.push({
                id: `${source.name}:${item.guid || item.link || item.title}`,
                source: source.name,
                title: item.title || 'Untitled story',
                link: item.link || '',
                publishedAt: item.isoDate || item.pubDate || null,
                image: this.getImageUrl(item),
                summary: this.getSummary(item),
            }));
        });

        articles.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
        return { articles, errors };
    }

    getImageUrl(item) {
        const candidates = [item.enclosure?.url, item.image?.url, item.mediaContent?.$.url, item.mediaContent?.url, item.mediaThumbnail?.$.url, item.mediaThumbnail?.url];
        return candidates.find((value) => typeof value === 'string' && /^https?:\/\//.test(value)) || null;
    }

    getSummary(item) {
        const text = item.contentSnippet || item.summary || item.content || item.description || '';
        return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 260);
    }
}
