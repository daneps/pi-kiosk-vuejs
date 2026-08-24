import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = process.env.PHOTO_SYNC_SOURCE;
const sourceDirectory = path.join(root, 'backend/data/photos/source');
const optimizedDirectory = path.join(root, 'backend/data/photos/optimized');
const imageExtensions = /\.(avif|heic|heif|jpe?g|png|webp)$/i;

if (!source) {
    console.error('Set PHOTO_SYNC_SOURCE to a local directory or rsync remote (for example: user@host:/photos/).');
    process.exit(1);
}

await fs.mkdir(sourceDirectory, { recursive: true });
await run('rsync', ['-a', '--delete', '--exclude', '.*', ensureTrailingSlash(source), `${sourceDirectory}/`]);
await fs.rm(optimizedDirectory, { recursive: true, force: true });
await fs.mkdir(optimizedDirectory, { recursive: true });

const images = await findImages(sourceDirectory);
let converted = 0;
for (const sourceFile of images) {
    const relative = path.relative(sourceDirectory, sourceFile);
    const destination = path.join(optimizedDirectory, relative.replace(imageExtensions, '.jpg'));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await sharp(sourceFile).rotate().resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(destination);
    converted += 1;
}
console.log(`Synced and optimized ${converted} photo${converted === 1 ? '' : 's'}.`);

function ensureTrailingSlash(value) { return value.endsWith('/') ? value : `${value}/`; }
function run(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit' });
        child.on('error', reject);
        child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)));
    });
}
async function findImages(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map((entry) => {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) return findImages(file);
        return entry.isFile() && imageExtensions.test(entry.name) ? [file] : [];
    }));
    return nested.flat();
}
