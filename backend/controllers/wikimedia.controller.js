export class WikimediaController {
    constructor(wikimediaService) {
        this.wikimediaService = wikimediaService;
    }

    getFeatured = async (_req, res) => {
        try {
            return res.json(await this.wikimediaService.getFeatured());
        } catch (error) {
            console.error('WikimediaController Error:', error);
            return res.status(502).json({ error: 'Unable to load Wikipedia’s daily feature.' });
        }
    };
}
