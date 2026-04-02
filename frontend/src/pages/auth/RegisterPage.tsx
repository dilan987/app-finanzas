import { useState, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiEnvelope, HiLockClosed, HiUser, HiCheck, HiXMark } from 'react-icons/hi2';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Minimo 8 caracteres', test: (pw) => pw.length >= 8 },
  { label: 'Al menos una mayuscula', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Al menos un numero', test: (pw) => /\d/.test(pw) },
  { label: 'Al menos un caracter especial', test: (pw) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(pw) },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  );

  const allPasswordRulesPassed = passwordChecks.every((r) => r.passed);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'El nombre es obligatorio';
    if (!email.trim()) {
      next.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Ingresa un correo valido';
    }
    if (!password) {
      next.password = 'La contrasena es obligatoria';
    } else if (!allPasswordRulesPassed) {
      next.password = 'La contrasena no cumple los requisitos';
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

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
    } catch {
      // Error is handled by useAuth hook via toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-900">
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
            Crea tu cuenta y toma el control de tus finanzas
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-center text-lg font-semibold text-gray-900 dark:text-white">
            Crear Cuenta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Nombre"
              placeholder="Juan Perez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              icon={<HiUser className="h-4 w-4" />}
              autoComplete="name"
              disabled={loading}
            />

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
              placeholder="Crea una contrasena segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<HiLockClosed className="h-4 w-4" />}
              autoComplete="new-password"
              disabled={loading}
            />

            {/* Password requirements */}
            {password.length > 0 && (
              <div className="space-y-1.5 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                {passwordChecks.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    {rule.passed ? (
                      <HiCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <HiXMark className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                    )}
                    <span
                      className={
                        rule.passed
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    >
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Input
              label="Confirmar contrasena"
              type="password"
              placeholder="Repite tu contrasena"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              icon={<HiLockClosed className="h-4 w-4" />}
              autoComplete="new-password"
              disabled={loading}
            />

            <Button type="submit" fullWidth loading={loading} size="lg">
              Crear Cuenta
            </Button>
          </form>
        </div>

        {/* Link to login */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
