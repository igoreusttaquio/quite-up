import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { AppToaster } from './components/AppToaster'
import { invalidateTransactionData, queryClient } from './lib/queryClient'
import { clearPersistedCache, idbPersister } from './lib/offline'
import { useAuthStore } from './store/authStore'
import { router } from './router'
import './styles/index.css'

const WEEK = 7 * 24 * 60 * 60 * 1000

// Ao sair da conta, o cache local (dados e fila offline) é apagado.
useAuthStore.subscribe((state, prev) => {
  if (prev.accessToken && !state.accessToken) {
    queryClient.clear()
    void clearPersistedCache()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: idbPersister,
            maxAge: WEEK,
            // Troque o buster quando o formato dos dados em cache mudar.
            buster: 'v1',
            dehydrateOptions: {
              shouldDehydrateQuery: (query) => query.state.status === 'success',
              // Só mutações pausadas (feitas offline) vão para a fila persistida.
              shouldDehydrateMutation: (mutation) => mutation.state.isPaused,
            },
          }}
          // Ao abrir o app, retoma a fila offline e atualiza os dados.
          onSuccess={() => queryClient.resumePausedMutations().then(() => invalidateTransactionData())}
        >
          <AppToaster />
          <RouterProvider router={router} />
        </PersistQueryClientProvider>
      </PreferencesProvider>
    </ThemeProvider>
  </StrictMode>,
)
