import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiEnvelope, HiLockClosed } from 'react-icons/hi2';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AuthLayout from '../components/layout/AuthLayout';
import { useAuth } from '../hooks/useAuth';

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
    <AuthLayout
      title="Iniciar Sesion"
      subtitle="Ingresa a tu cuenta para continuar"
    >
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
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Olvidaste tu contrasena?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg">
          Iniciar Sesion
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        No tienes una cuenta?{' '}
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Crear cuenta
        </Link>
      </p>
    </AuthLayout>
  );
}
