import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiEnvelope, HiLockClosed } from 'react-icons/hi2';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!email.trim()) {
      next.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Ingresa un correo valido';
    }
    if (!password) {
      next.password = 'La contrasena es obligatoria';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch {
      // Error is handled by useAuth hook via toast
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
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona tus finanzas personales
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-center text-lg font-semibold text-gray-900 dark:text-white">
            Iniciar Sesion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Correo electronico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<HiEnvelope className="h-4 w-4" />}
              autoComplete="email"
              disabled={loading}
            />

            <Input
              label="Contrasena"
              type="password"
              placeholder="Tu contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<HiLockClosed className="h-4 w-4" />}
              autoComplete="current-password"
              disabled={loading}
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              Iniciar Sesion
            </Button>
          </form>
        </div>

        {/* Link to register */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No tienes una cuenta?{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
