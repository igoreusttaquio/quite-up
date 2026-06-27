import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Field, Text, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { LockClosedFilled } from '@fluentui/react-icons'
import { useResetPassword } from '../hooks/useAuth'

const schema = z
  .object({
    newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmNewPassword: z.string().min(1, 'Confirmação é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Senhas não conferem',
    path: ['confirmNewPassword'],
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const resetPassword = useResetPassword()

  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword.mutateAsync({ token, ...data })
      navigate('/login')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError('root', { message: axiosError?.response?.data?.message || 'Erro ao redefinir senha.' })
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center py-4">
        <MessageBar intent="error">
          <MessageBarBody>Token de recuperação inválido ou ausente.</MessageBarBody>
        </MessageBar>
        <Link to="/forgot-password" className="text-brand hover:underline text-sm">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
          <LockClosedFilled className="text-brand" style={{ fontSize: 24 }} />
        </div>
        <div>
          <Text as="h2" size={700} weight="semibold" block>Redefinir Senha</Text>
          <Text size={300} className="text-muted mt-1 block">
            Escolha uma nova senha para sua conta
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
          name="newPassword"
          control={control}
          render={({ field }) => (
            <Field
              label="Nova Senha"
              required
              validationState={errors.newPassword ? 'error' : undefined}
              validationMessage={errors.newPassword?.message}
            >
              <Input {...field} type="password" placeholder="Mínimo 6 caracteres" size="large" />
            </Field>
          )}
        />

        <Controller
          name="confirmNewPassword"
          control={control}
          render={({ field }) => (
            <Field
              label="Confirmar Nova Senha"
              required
              validationState={errors.confirmNewPassword ? 'error' : undefined}
              validationMessage={errors.confirmNewPassword?.message}
            >
              <Input {...field} type="password" placeholder="Repita a nova senha" size="large" />
            </Field>
          )}
        />

        <Button
          type="submit"
          appearance="primary"
          className="w-full"
          size="large"
          disabled={resetPassword.isPending}
          icon={resetPassword.isPending ? <Spinner size="tiny" /> : undefined}
        >
          {resetPassword.isPending ? 'Redefinindo…' : 'Redefinir Senha'}
        </Button>
      </form>

      <Text size={200} className="text-muted text-center block">
        <Link to="/login" className="text-brand hover:underline font-medium">
          Voltar para o login
        </Link>
      </Text>
    </div>
  )
}
