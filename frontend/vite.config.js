import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production';
  
  const config = {
    plugins: [
      react({
        include: "**/*.{jsx,js,ts,tsx}",
        babel: {
          plugins: [],
          babelrc: false,
          configFile: false,
        }
      })
    ],
    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    esbuild: {
      include: /src\/.*\.[jt]sx?$/,  // include .js, .jsx, .ts, .tsx
      exclude: []
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path
        }
      },
      // Allow connections from local network
      host: '0.0.0.0'
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Copy files from public to dist
      copyPublicDir: true,
      // Generate service worker
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts']
          }
        }
      }
    },
    optimizeDeps: {
      exclude: []
    }
  };
  
  // Production specific settings
  if (isProd) {
    // Ensure paths to assets work correctly in production
    config.base = './';
    
    // Provide consistent API URLs in production
    // This ensures all URLs are relative to the deployed domain
    config.define = {
      ...config.define,
      'import.meta.env.VITE_API_URL': JSON.stringify('')
    };
  }
  
  return config;
});



