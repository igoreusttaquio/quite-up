import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from '@fluentui/react-components'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import { TOASTER_ID } from './hooks/useAppToast'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster toasterId={TOASTER_ID} position="top-end" timeout={4000} />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
