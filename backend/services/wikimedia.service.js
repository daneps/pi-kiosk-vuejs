export class WikimediaService {
    constructor(wikimediaStore) {
        this.wikimediaStore = wikimediaStore;
    }

    getFeatured() {
        return this.wikimediaStore.getFeatured();
    }
}
