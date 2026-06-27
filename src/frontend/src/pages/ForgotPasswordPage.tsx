import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Field, Text, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components'
import { Link } from 'react-router-dom'
import { MailFilled, CheckmarkCircleFilled } from '@fluentui/react-icons'
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

  if (forgotPassword.isSuccess) {
    return (
      <div className="space-y-6 text-center py-4">
        <CheckmarkCircleFilled className="text-income" style={{ fontSize: 56 }} />
        <div>
          <Text as="h2" size={700} weight="semibold" block>E-mail enviado!</Text>
          <Text size={300} className="text-muted mt-2 block">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </Text>
        </div>
        <Link to="/login" className="text-brand hover:underline text-sm font-medium">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
          <MailFilled className="text-brand" style={{ fontSize: 24 }} />
        </div>
        <div>
          <Text as="h2" size={700} weight="semibold" block>Recuperar Senha</Text>
          <Text size={300} className="text-muted mt-1 block">
            Informe seu e-mail e enviaremos um link de recuperação
          </Text>
        </div>
      </div>

      {errors.root && (
        <MessageBar intent="error">
          <MessageBarBody>{errors.root.message}</MessageBarBody>
        </MessageBar>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Input {...field} type="email" placeholder="seu@email.com" size="large" />
            </Field>
          )}
        />

        <Button
          type="submit"
          appearance="primary"
          className="w-full"
          size="large"
          disabled={forgotPassword.isPending}
          icon={forgotPassword.isPending ? <Spinner size="tiny" /> : undefined}
        >
          {forgotPassword.isPending ? 'Enviando…' : 'Enviar Link'}
        </Button>
      </form>

      <Text size={200} className="text-muted text-center block">
        Lembrou a senha?{' '}
        <Link to="/login" className="text-brand hover:underline font-medium">
          Entrar
        </Link>
      </Text>
    </div>
  )
}
