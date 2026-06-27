import { Component, type ReactNode } from 'react'
import { Button, Text } from '@fluentui/react-components'
import { ErrorCircleFilled } from '@fluentui/react-icons'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
          <ErrorCircleFilled className="text-expense" style={{ fontSize: 48 }} />
          <Text as="h2" size={600} weight="semibold">Algo deu errado</Text>
          <Text size={300} className="text-muted max-w-md">
            {this.state.error?.message || 'Ocorreu um erro inesperado nesta página.'}
          </Text>
          <Button appearance="primary" onClick={() => this.setState({ hasError: false })}>
            Tentar novamente
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
