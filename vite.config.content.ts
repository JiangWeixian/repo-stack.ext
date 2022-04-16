import { defineConfig, Plugin } from 'vite'
import fs from 'fs-extra'

import { sharedConfig } from './vite.config'
import { r, isDev, log } from './scripts/utils'

// issues: https://github.com/saadeghi/daisyui/issues/687
const PatchPlugin = (): Plugin => {
  return {
    name: 'patch-daisyui-styles',
    closeBundle() {
      if (fs.existsSync(r('extension/dist/contentScripts/style.css'))) {
        log('PATCH', 'daisyui')
        const styles = fs.readFileSync(r('extension/dist/contentScripts/style.css')).toString()
        const nextStyles = styles.replace(/:root/g, '*,:before,:after')
        fs.writeFileSync(r('extension/dist/contentScripts/style.css'), nextStyles)
      }
    },
  }
}

// bundling the content script using Vite
export default defineConfig({
  ...sharedConfig,
  build: {
    watch: isDev
      ? {
          include: [r('src/contentScripts/**/*'), r('src/logic/**/*')],
        }
      : undefined,
    outDir: r('extension/dist/contentScripts'),
    cssCodeSplit: false,
    emptyOutDir: false,
    sourcemap: isDev ? 'inline' : false,
    lib: {
      entry: r('src/contentScripts/index.tsx'),
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.global.js',
      },
    },
  },
  plugins: [...sharedConfig.plugins!, PatchPlugin()],
})
