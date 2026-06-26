import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FluentProvider theme={webLightTheme}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </FluentProvider>
  </StrictMode>,
)
