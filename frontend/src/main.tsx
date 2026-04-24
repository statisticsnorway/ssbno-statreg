import '@digdir/designsystemet-css'
import '@digdir/designsystemet-css/theme'
import '@navikt/ds-css'  


import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename='/'>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
