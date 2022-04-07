import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react-refresh'
import AutoImport from 'unplugin-auto-import/vite'
import { r, port, isDev } from './scripts/utils'

export const sharedConfig: UserConfig = {
  root: r('src'),
  resolve: {
    alias: {
      '~/': `${r('src')}/`,
    },
  },
  define: {
    __DEV__: isDev,
  },
  plugins: [
    react(),

    AutoImport({
      imports: [
        {
          'webextension-polyfill': [['*', 'browser']],
        },
      ],
    }),

    // rewrite assets to use relative path
    {
      name: 'assets-rewrite',
      enforce: 'post',
      apply: 'build',
      transformIndexHtml(html) {
        return html.replace(/"\/assets\//g, '"../assets/')
      },
    },
  ],
  optimizeDeps: {
    include: ['webextension-polyfill'],
  },
}

export default defineConfig(({ command }) => {
  return {
    ...sharedConfig,
    base: command === 'serve' ? `http://localhost:${port}/` : undefined,
    server: {
      port,
      hmr: {
        host: 'localhost',
      },
    },
    build: {
      outDir: r('extension/dist'),
      emptyOutDir: false,
      sourcemap: isDev ? 'inline' : false,
      // https://developer.chrome.com/docs/webstore/program_policies/#:~:text=Code%20Readability%20Requirements
      terserOptions: {
        mangle: false,
      },
      rollupOptions: {
        input: {
          options: r('src/options/index.html'),
        },
      },
    },
    plugins: [...sharedConfig.plugins!],
  }
})
