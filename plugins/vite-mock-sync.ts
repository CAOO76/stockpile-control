import type { Plugin } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SYNC_FILE = join(process.cwd(), '.firebase', 'mock_sync.json');

export function mockSyncPlugin(): Plugin {
  return {
    name: 'vite-plugin-mock-sync',
    configureServer(server) {
      // Ensure directory exists
      try {
        mkdirSync(join(process.cwd(), '.firebase'), { recursive: true });
        if (!existsSync(SYNC_FILE)) {
          writeFileSync(SYNC_FILE, JSON.stringify({}), 'utf-8');
        }
      } catch (e) {
        console.error('[MockSyncPlugin] Error init', e);
      }

      server.middlewares.use((req, res, next) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS' && (req.url === '/__mock_sync_push' || req.url === '/__mock_sync_pull')) {
           res.setHeader('Access-Control-Allow-Origin', '*');
           res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
           res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
           res.end();
           return;
        }

        if (req.url === '/__mock_sync_pull' && req.method === 'GET') {
          try {
            const data = readFileSync(SYNC_FILE, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(data);
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to read' }));
          }
          return;
        }

        if (req.url === '/__mock_sync_push' && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', chunk => {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          });
          req.on('end', () => {
            try {
              const body = Buffer.concat(chunks).toString('utf-8');
              const incoming = JSON.parse(body);
              let current = {};
              if (existsSync(SYNC_FILE)) {
                try {
                  current = JSON.parse(readFileSync(SYNC_FILE, 'utf-8'));
                } catch (e) {}
              }
              // Merge Object
              const merged = { ...current, ...incoming };
              writeFileSync(SYNC_FILE, JSON.stringify(merged, null, 2), 'utf-8');

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true }));

              // Enviar mensaje HMR para avisar a clientes conectados (Desktop)
              server.ws.send({
                type: 'custom',
                event: 'mock:sync-updated',
                data: merged
              });

            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to merge' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}
