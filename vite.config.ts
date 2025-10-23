import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import apiApp from './server';

function mountFirst(server: any, handler: any) {
  const stack = server.middlewares?.stack;
  if (Array.isArray(stack) && typeof stack.unshift === 'function') {
    stack.unshift({ route: '', handle: handler });
  } else {
    server.middlewares.use(handler);
  }
}

const apiPlugin: Plugin = {
  name: 'mordomozap-api-middleware',
  configureServer(server) {
    console.log('[vite] Dev server: mounting API middleware at /api/uaz (first)');
    const ping = (req: any, res: any, next: any) => {
      if (req.url === '/api/ping') {
        res.statusCode = 200;
        res.end('pong');
        return;
      }
      next();
    };
    const handler = (req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/api/')) {
        return (apiApp as any)(req, res, next);
      }
      next();
    };
    mountFirst(server as any, ping);
    mountFirst(server as any, handler);
  },
  configurePreviewServer(server) {
    console.log('[vite] Preview: mounting API middleware at /api/uaz (first)');
    const ping = (req: any, res: any, next: any) => {
      if (req.url === '/api/ping') {
        res.statusCode = 200;
        res.end('pong');
        return;
      }
      next();
    };
    const handler = (req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/api/')) {
        return (apiApp as any)(req, res, next);
      }
      next();
    };
    mountFirst(server as any, ping);
    mountFirst(server as any, handler);
  }
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const enableApi = env.VITE_ENABLE_API_MIDDLEWARE === 'true';
    return {
      server: {
        port: 5173,
        host: true,
      },
      preview: {
        port: 5173,
        host: true,
        strictPort: true
      },
      plugins: [react(), ...(enableApi ? [apiPlugin] : [])],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      logLevel: 'info'
    };
});
