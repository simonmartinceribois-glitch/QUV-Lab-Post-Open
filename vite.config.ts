import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/src/components/trial-tabs/')) {
              return 'quv-tabs';
            }
            if (id.includes('/src/components/results-subviews/')) {
              return 'quv-results';
            }
            if (id.includes('/src/components/bench/')) {
              return 'quv-bench';
            }
            if (id.includes('/src/components/phototheque/')) {
              return 'quv-photo';
            }
            if (id.includes('/src/components/wizard/')) {
              return 'quv-wizard';
            }
            if (id.includes('/src/components/')) {
              return 'quv-shell';
            }
            if (id.includes('/src/services/')) {
              return 'quv-services';
            }
            if (id.includes('/src/scientific/tests/') || id.includes('/src/scientific/analysis/tests/')) {
              return 'quv-tests';
            }
            if (id.includes('/src/scientific/')) {
              return 'quv-science';
            }
            if (id.includes('node_modules')) {
              if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
                return 'react-vendor';
              }
              if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-vendor/')) {
                return 'charts';
              }
              if (id.includes('/motion/') || id.includes('/framer-motion/')) {
                return 'motion';
              }
              if (id.includes('/lucide-react/')) {
                return 'icons';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
