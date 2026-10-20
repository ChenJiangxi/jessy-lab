import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { chatApiPlugin } from './server/chat-plugin';
import { ttsApiPlugin } from './server/tts-plugin';
import { adminApiPlugin } from './server/admin-plugin';

// Hosts nginx forwards to this process (production domain + local checks).
const allowedHosts = ['jessylab.cc', 'www.jessylab.cc', 'localhost', '127.0.0.1'];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [k, v] of Object.entries(env)) {
    if (!(k in process.env)) process.env[k] = v;
  }

  return {
    // The API plugins hook both `vite` (dev) and `vite preview` (production:
    // serves the built dist/ with the same /api/* middleware in one process).
    plugins: [react(), chatApiPlugin(), ttsApiPlugin(), adminApiPlugin()],
    server: { port: 5173, allowedHosts },
    preview: { port: 5173, allowedHosts },
    build: {
      rollupOptions: {
        output: {
          // Long-lived vendor chunk: a site edit doesn't bust React's cache.
          manualChunks: {
            react: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
          },
        },
      },
    },
  };
});
