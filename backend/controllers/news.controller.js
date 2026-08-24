export class NewsController {
    constructor(newsService) {
        this.newsService = newsService;
    }

    getHeadlines = async (req, res) => {
        try {
            const values = Array.isArray(req.query.source) ? req.query.source : [req.query.source];
            const sources = values.filter((value) => typeof value === 'string' && value.length > 0).map((value) => JSON.parse(value));
            if (!sources.length) return res.json({ articles: [], errors: [] });
            if (sources.length > 10 || sources.some((source) => !this.isRssSource(source))) return res.status(400).json({ error: 'News sources require a name and valid HTTP(S) URL (maximum 10).' });
            return res.json(await this.newsService.getHeadlines(sources));
        } catch (error) {
            console.error('NewsController Error:', error);
            return res.status(400).json({ error: error.message || 'Unable to process news sources.' });
        }
    }

    isRssSource(source) {
        if (!source || typeof source !== 'object' || typeof source.name !== 'string' || typeof source.url !== 'string') return false;
        try { const url = new URL(source.url); return url.protocol === 'https:' || url.protocol === 'http:'; } catch { return false; }
    }
}
