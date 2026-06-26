import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Field, Text, MessageBar, MessageBarBody } from '@fluentui/react-components'
import { Link } from 'react-router-dom'
import { useForgotPassword } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword()

  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword.mutateAsync(data)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError('root', { message: axiosError?.response?.data?.message || 'Erro ao enviar recuperação.' })
    }
  }

  return (
    <div>
      <Text as="h2" size={600} weight="semibold" block className="mb-2 text-center">
        Recuperar Senha
      </Text>
      <Text size={300} className="text-center mb-6 block" style={{ color: 'var(--colorNeutralForeground2)' }}>
        Receba um link para redefinir sua senha
      </Text>

      {errors.root && (
        <MessageBar intent="error" className="mb-4">
          <MessageBarBody>{errors.root.message}</MessageBarBody>
        </MessageBar>
      )}

      {forgotPassword.isSuccess && (
        <MessageBar intent="success" className="mb-4">
          <MessageBarBody>Link de recuperação enviado para seu e-mail.</MessageBarBody>
        </MessageBar>
      )}

      <div className="space-y-4">
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Field
              label="E-mail"
              required
              validationState={errors.email ? 'error' : undefined}
              validationMessage={errors.email?.message}
            >
              <Input {...field} type="email" placeholder="seu@email.com" />
            </Field>
          )}
        />
      </div>

      <Button
        appearance="primary"
        className="w-full mt-6"
        size="large"
        onClick={handleSubmit(onSubmit)}
        disabled={forgotPassword.isPending || forgotPassword.isSuccess}
      >
        {forgotPassword.isPending ? 'Enviando...' : 'Enviar Link'}
      </Button>

      <div className="text-center mt-6">
        <Text size={200}>
          Lembrou a senha?{' '}
          <Link to="/login" style={{ color: 'var(--colorBrandForeground1)' }}>
            Entrar
          </Link>
        </Text>
      </div>
    </div>
  )
}
