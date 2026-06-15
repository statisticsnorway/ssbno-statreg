import '@digdir/designsystemet-css'
import '@digdir/designsystemet-css/theme'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.tsx'

export const BASE_ROUTE = '/statistikkregisteret'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename='/statistikkregisteret'>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
