import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { HiLockClosed, HiCheckCircle } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        {/* Logo / App Name */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Finanzas App
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {success ? (
            /* Success State */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <HiCheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Contrasena restablecida
              </h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
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
            <>
              <h2 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
                Restablecer contrasena
              </h2>
              <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Ingresa tu nueva contrasena para restablecer el acceso a tu cuenta.
              </p>

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
            </>
          )}
        </div>

        {/* Link back to login */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Volver a iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
