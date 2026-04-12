import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { HiLockClosed, HiCheckCircle } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AuthLayout from '../components/layout/AuthLayout';
import { authApi } from '../api/auth.api';

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!password) {
      next.password = 'La contrasena es obligatoria';
    } else if (password.length < 8) {
      next.password = 'La contrasena debe tener al menos 8 caracteres';
    }
    if (!confirmPassword) {
      next.confirmPassword = 'Confirma tu contrasena';
    } else if (password !== confirmPassword) {
      next.confirmPassword = 'Las contrasenas no coinciden';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (!token) {
      toast.error('Token de recuperacion no encontrado. Solicita un nuevo enlace.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch {
      toast.error('Error al restablecer la contrasena. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Nueva Contrasena"
      subtitle="Ingresa tu nueva contrasena"
    >
      {success ? (
        /* Success State */
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <HiCheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">
            Contrasena restablecida
          </h2>
          <p className="mb-6 text-sm text-text-secondary">
            Tu contrasena ha sido restablecida exitosamente. Ya puedes iniciar sesion con tu
            nueva contrasena.
          </p>
          <Button
            fullWidth
            size="lg"
            onClick={() => navigate('/login')}
          >
            Ir a Iniciar Sesion
          </Button>
        </div>
      ) : (
        /* Form State */
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Nueva contrasena"
            type="password"
            placeholder="Minimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={<HiLockClosed className="h-4 w-4" />}
            autoComplete="new-password"
            disabled={loading}
          />

          <Input
            label="Confirmar contrasena"
            type="password"
            placeholder="Repite tu nueva contrasena"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            icon={<HiLockClosed className="h-4 w-4" />}
            autoComplete="new-password"
            disabled={loading}
          />

          <Button type="submit" fullWidth loading={loading} size="lg">
            Restablecer Contrasena
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Volver a iniciar sesion
        </Link>
      </p>
    </AuthLayout>
  );
}
