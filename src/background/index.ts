import { sendMessage, onMessage } from 'webext-bridge'
import browser, { Tabs } from 'webextension-polyfill'

import { REQUEST_NPM_DETAIL, TOGGLE_MODAL } from '~/logic/constants'
import { fetchPkgDetail, FetchPkgDetailOptions } from '~/logic/api'

// FIXME: hmr not working on manifest v3
// only on dev mode
// if (__DEV__) {
//   // load latest content script
//   import('./contentScriptHMR')
// }

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
onMessage<FetchPkgDetailOptions & { tabId: number }, string>(
  REQUEST_NPM_DETAIL,
  async ({ data }) => {
    try {
      console.log('received', data)
      if (!data.tabId || !data?.name) {
        return {}
      }
      const detail = await fetchPkgDetail({ name: data.name })
      sendMessage(REQUEST_NPM_DETAIL, detail, { context: 'content-script', tabId: data.tabId })
      return detail
    } catch (e) {
      console.log(e)
      return {}
    }
  },
)

/**
 * Reaction on click popup icon
 */
browser.action.onClicked.addListener(async (tab) => {
  console.log('click popup icon')
  if (!tab.id) {
    return
  }
  sendMessage(TOGGLE_MODAL, { tabId: tab.id }, { context: 'content-script', tabId: tab.id })
})
