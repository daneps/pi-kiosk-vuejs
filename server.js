// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import calendarRouter from './backend/routes/calendar.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global API payload configurations
app.use(express.json());

// 1. Mount Architectural Backend Endpoints
app.use('/api', calendarRouter);
app.use('/photos', express.static(path.resolve(__dirname, './backend/data/photos/optimized'), { maxAge: '1d', immutable: true }));

// 2. Pi-Optimized Production Static File Server
// Checks if the app is running in production mode
if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, './dist');

    // Serve raw compressed CSS, JS, and Images efficiently
    app.use(express.static(distPath));

    // Handle Single Page Application (SPA) Client Routing
    // Express 5 requires a named wildcard parameter.
    app.get('/{*splat}', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // Helpful log reminder during local programming iterations
    app.get('/', (req, res) => {
        res.status(200).send('API active. Start Vite dev server for frontend UI access.');
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [Mode: ${process.env.NODE_ENV || 'development'}]`);
});
