import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Field, Text, MessageBar, MessageBarBody } from '@fluentui/react-components'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
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
      <MessageBar intent="error">
        <MessageBarBody>Token de recuperação inválido ou ausente.</MessageBarBody>
      </MessageBar>
    )
  }

  return (
    <div>
      <Text as="h2" size={600} weight="semibold" block className="mb-6 text-center">
        Redefinir Senha
      </Text>

      {errors.root && (
        <MessageBar intent="error" className="mb-4">
          <MessageBarBody>{errors.root.message}</MessageBarBody>
        </MessageBar>
      )}

      <div className="space-y-4">
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
              <Input {...field} type="password" placeholder="Mínimo 6 caracteres" />
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
              <Input {...field} type="password" placeholder="Repita a senha" />
            </Field>
          )}
        />
      </div>

      <Button
        appearance="primary"
        className="w-full mt-6"
        size="large"
        onClick={handleSubmit(onSubmit)}
        disabled={resetPassword.isPending}
      >
        {resetPassword.isPending ? 'Redefinindo...' : 'Redefinir Senha'}
      </Button>

      <div className="text-center mt-6">
        <Text size={200}>
          <Link to="/login" style={{ color: 'var(--colorBrandForeground1)' }}>
            Voltar para login
          </Link>
        </Text>
      </div>
    </div>
  )
}
