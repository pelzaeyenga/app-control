import React from 'react'

//import { StrictMode } from 'react'
//import { createRoot } from 'react-dom/client'
import ReactDOM from 'react-dom/client'
import './index.css'
//import App from './App'
import {BrowserRouter as Router} from 'react-router-dom'
import App from 'next/app'

ReactDOM.createRoot (document.getElementById('root')!).render (

<Router>
  <React.StrictMode>
    <App />
  </React.StrictMode>
</Router>
)