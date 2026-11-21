import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { AppToaster } from './components/AppToaster'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <QueryClientProvider client={queryClient}>
          <AppToaster />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </PreferencesProvider>
    </ThemeProvider>
  </StrictMode>,
)
