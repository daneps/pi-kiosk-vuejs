export class PhotoController {
    constructor(photoService) { this.photoService = photoService; }
    getRandomPhoto = async (req, res) => {
        try {
            const photo = await this.photoService.getRandomPhoto(typeof req.query.exclude === 'string' ? req.query.exclude.replace(/^\/photos\//, '') : '');
            if (!photo) return res.status(404).json({ error: 'No optimized photos are available. Run pnpm photos:sync first.' });
            return res.json(photo);
        } catch (error) {
            console.error('PhotoController Error:', error);
            return res.status(500).json({ error: 'Unable to load a photo.' });
        }
    }
}
