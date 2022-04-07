import { isFirefox, isForbiddenUrl } from '~/env'
import browser from 'webextension-polyfill'

// Firefox fetch files from cache instead of reloading changes from disk,
// hmr will not work as Chromium based browser
browser.webNavigation.onCommitted.addListener(({ tabId, frameId, url }) => {
  // Filter out non main window events.
  if (frameId !== 0) return

  if (isForbiddenUrl(url)) return

  // inject the latest scripts
  browser.scripting
    .executeScript({
      files: [`${isFirefox ? '' : '.'}/dist/contentScripts/index.global.js`],
      target: { tabId },
    })
    .catch((error) => console.error(error))
})
