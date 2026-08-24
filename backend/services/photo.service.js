export class PhotoService {
    constructor(photoStore) { this.photoStore = photoStore; }
    async getRandomPhoto(exclude) {
        const file = await this.photoStore.getRandomPhoto(exclude);
        return file ? { image: `/photos/${file}` } : null;
    }
}
