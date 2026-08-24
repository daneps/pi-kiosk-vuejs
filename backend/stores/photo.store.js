import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_DIRECTORY = path.resolve(__dirname, '../data/photos/optimized');
const CACHE_TTL_MS = 60_000;

export class PhotoStore {
    constructor() {
        this.cache = { files: [], expiresAt: 0 };
    }

    async getRandomPhoto(exclude) {
        if (this.cache.expiresAt < Date.now()) {
            this.cache = { files: await this.listPhotos(PHOTO_DIRECTORY), expiresAt: Date.now() + CACHE_TTL_MS };
        }
        const candidates = this.cache.files.filter((file) => file !== exclude);
        const files = candidates.length ? candidates : this.cache.files;
        if (!files.length) return null;
        return files[Math.floor(Math.random() * files.length)];
    }

    async listPhotos(directory, relativeDirectory = '') {
        try {
            const entries = await fs.readdir(directory, { withFileTypes: true });
            const files = await Promise.all(entries.map(async (entry) => {
                const relativePath = path.posix.join(relativeDirectory, entry.name);
                if (entry.isDirectory()) return this.listPhotos(path.join(directory, entry.name), relativePath);
                return entry.isFile() && /\.jpe?g$/i.test(entry.name) ? [relativePath] : [];
            }));
            return files.flat();
        } catch (error) {
            if (error.code === 'ENOENT') return [];
            throw error;
        }
    }
}
