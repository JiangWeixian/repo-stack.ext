/* eslint-disable no-console */
import React from 'react'
import { onMessage } from 'webext-bridge'
import { App } from './views/App'
import { render } from 'react-dom'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
;(() => {
  console.info('[repo-stack] Hello world from content script')

  // communication example: send previous tab title from background page
  onMessage('tab-prev', ({ data }) => {
    if (__DEV__) {
      console.log(`[Repo Stack] Navigate from page "${data.title}"`)
    }
  })

  // mount component to context window
  const container = document.createElement('div')
  const root = document.createElement('div')
  const styleEl = document.createElement('link')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  container.className = 'repo-stack'
  styleEl.setAttribute('rel', 'stylesheet')
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
  shadowDOM.appendChild(styleEl)
  shadowDOM.appendChild(root)
  document.body.appendChild(container)
  render(<App />, root)
})()
