import { Plugin } from 'vite';
import express, { Express } from 'express';
import { handleIdentifyHardware, handleImageSearch, handleHardwareChat } from './apiHandler';

export function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'hardware-catalogue-api-middleware',
    configureServer(server) {
      const app: Express = express();

      // Support base64 image uploads up to 25MB
      app.use(express.json({ limit: '25mb' }));
      app.use(express.urlencoded({ extended: true, limit: '25mb' }));

      // API Routes
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

      // Mount on Vite dev server
      server.middlewares.use(app);
    },
  };
}
