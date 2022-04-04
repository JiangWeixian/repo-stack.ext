import React from 'react'
import ReactDOM from 'react-dom'
import ready from 'document-ready'

import '../styles/main.css'
import { Popup } from './Popup'

ready(() => {
  ReactDOM.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>,
    document.getElementById('root'),
  )
})
