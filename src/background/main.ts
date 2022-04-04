import { sendMessage, onMessage } from 'webext-bridge'
import { Tabs } from 'webextension-polyfill'

import { REQUEST_NPM_DETAIL, TOGGLE_MODAL } from '~/logic/constants'
import { fetchPkgDetail, FetchPkgDetailOptions } from '~/logic/api'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  } catch {
    return
  }

  // eslint-disable-next-line no-console
  console.log('previous tab', tab)
  sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
})

/**
 * @description request npm package detail
 */
onMessage<FetchPkgDetailOptions, string>(REQUEST_NPM_DETAIL, async ({ data }) => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    console.log(tab, data?.name)
    if (!tab.id || !data?.name) {
      return {}
    }
    const detail = await fetchPkgDetail({ name: data.name })
    sendMessage(REQUEST_NPM_DETAIL, detail, { context: 'content-script', tabId: tab.id })
    return detail
  } catch {
    return {}
  }
})

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.id,
    }
  } catch {
    return {
      title: undefined,
    }
  }
})

/**
 * Reaction on click popup icon
 */
browser.browserAction.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return
  }
  sendMessage(TOGGLE_MODAL, {}, { context: 'content-script', tabId: tab.id })
})
