import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useResetPassword } from '../hooks/useAuth'

const schema = z.object({
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmNewPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmNewPassword, { message: 'Senhas não conferem', path: ['confirmNewPassword'] })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const resetPassword = useResetPassword()

  const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword.mutateAsync({ token, ...data })
      navigate('/login')
    } catch {
      setError('root', { message: 'Erro ao redefinir senha.' })
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center py-4">
        <Alert variant="destructive">
          <AlertDescription>Token de recuperação inválido ou ausente.</AlertDescription>
        </Alert>
        <Link to="/forgot-password" className="text-sm text-primary hover:underline">Solicitar novo link</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <LockKeyhole className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Redefinir Senha</h2>
          <p className="text-sm text-muted-foreground mt-1">Escolha uma nova senha para sua conta</p>
        </div>
      </div>

      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nova Senha</Label>
          <Input id="newPassword" type="password" placeholder="Mínimo 6 caracteres" {...register('newPassword')} />
          {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
          <Input id="confirmNewPassword" type="password" placeholder="Repita a nova senha" {...register('confirmNewPassword')} />
          {errors.confirmNewPassword && <p className="text-xs text-destructive">{errors.confirmNewPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? 'Redefinindo…' : 'Redefinir Senha'}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        <Link to="/login" className="text-primary hover:underline font-medium">Voltar para o login</Link>
      </p>
    </div>
  )
}
