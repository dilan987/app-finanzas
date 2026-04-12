import { useState, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiEnvelope, HiLockClosed, HiUser, HiCheck, HiXMark } from 'react-icons/hi2';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AuthLayout from '../components/layout/AuthLayout';
import { useAuth } from '../hooks/useAuth';

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
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Registrate para comenzar a gestionar tus finanzas"
    >
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
          <div className="space-y-1.5 rounded-lg bg-surface-secondary p-3">
            {passwordChecks.map((rule) => (
              <div key={rule.label} className="flex items-center gap-2 text-xs">
                {rule.passed ? (
                  <HiCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <HiXMark className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                )}
                <span
                  className={
                    rule.passed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-text-secondary'
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

      <p className="mt-6 text-center text-sm text-text-secondary">
        Ya tienes una cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Iniciar sesion
        </Link>
      </p>
    </AuthLayout>
  );
}
