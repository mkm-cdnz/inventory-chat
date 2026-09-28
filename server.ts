import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleIdentifyHardware, handleImageSearch, handleHardwareChat } from './server/apiHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API Endpoints
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'Matt Millar Hardware Catalogue API',
    version: '2.0',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/identify', handleIdentifyHardware);
app.post('/api/v1/image-search', handleImageSearch);
app.post('/api/v1/chat', handleHardwareChat);

// Serve static frontend build
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Matt Millar Hardware Catalogue Server listening on port ${port}`);
});
