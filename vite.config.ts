import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';

export default defineConfig(() => {
  let localConfig: any = {};
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      localConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.error('Error reading firebase-applet-config.json:', e);
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      '__FIREBASE_CONFIG__': JSON.stringify({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || '',
        appId: process.env.VITE_FIREBASE_APP_ID || localConfig.appId || '',
        apiKey: process.env.VITE_FIREBASE_API_KEY || localConfig.apiKey || '',
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain || '',
        firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId || '',
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket || '',
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || '',
      })
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
