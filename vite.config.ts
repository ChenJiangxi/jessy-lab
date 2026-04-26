import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { chatApiPlugin } from './server/chat-plugin';
import { ttsApiPlugin } from './server/tts-plugin';
import { adminApiPlugin } from './server/admin-plugin';
import { faceTapeApiPlugin } from './server/face-tape-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [k, v] of Object.entries(env)) {
    if (!(k in process.env)) process.env[k] = v;
  }

  return {
    plugins: [
      react(),
      chatApiPlugin(),
      ttsApiPlugin(),
      adminApiPlugin(),
      faceTapeApiPlugin(),
    ],
    server: {
      port: 5173,
      // Allow the production domain when this same dev server runs
      // behind nginx on jessylab.cc.
      allowedHosts: ['jessylab.cc', 'www.jessylab.cc', 'localhost', '127.0.0.1'],
    },
  };
});
