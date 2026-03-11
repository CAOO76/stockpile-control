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
        // Handle CORS (Wide Open for local dev sync)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
           res.end();
           return;
        }

        if (req.url === '/__mock_sync_reset' && req.method === 'POST') {
          try {
            writeFileSync(SYNC_FILE, JSON.stringify({}), 'utf-8');
            res.end(JSON.stringify({ success: true }));
            server.ws.send({ type: 'custom', event: 'mock:sync-updated', data: {} });
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to reset' }));
          }
          return;
        }

        if (req.url === '/__mock_sync_pull' && req.method === 'GET') {
          try {
            const rawData = readFileSync(SYNC_FILE, 'utf-8');
            const data = JSON.parse(rawData);
            
            // Strip large base64 strings to create a metadata-only payload
            const metadataOnly: any = {};
            Object.keys(data).forEach(key => {
                const value = data[key];
                // ONLY strip objects, NEVER arrays (ID lists)
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    const stripped = { ...value, __is_lazy: true };
                    // Remove photo URLs but keep the structure
                    if (stripped.photo_url && (stripped.photo_url.length > 100 || stripped.photo_url.startsWith('data:'))) {
                        stripped.photo_url = '__LAZY_LOAD__';
                    }
                    if (stripped.initial_photo_url && stripped.initial_photo_url.length > 100) {
                        stripped.initial_photo_url = '__LAZY_LOAD__';
                    }
                    if (stripped.last_photo_url && stripped.last_photo_url.length > 100) {
                        stripped.last_photo_url = '__LAZY_LOAD__';
                    }
                    metadataOnly[key] = stripped;
                } else {
                    metadataOnly[key] = value;
                }
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(metadataOnly));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to read' }));
          }
          return;
        }

        // New endpoint to fetch full data for a specific key (Lazy Load)
        if (req.url?.startsWith('/__mock_sync_get') && req.method === 'GET') {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const key = url.searchParams.get('key');
            if (!key) throw new Error('Key required');

            const data = JSON.parse(readFileSync(SYNC_FILE, 'utf-8'));
            const value = data[key] || null;

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(value));
          } catch (e) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Key not found' }));
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
