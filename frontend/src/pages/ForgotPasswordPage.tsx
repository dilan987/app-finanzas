import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiEnvelope, HiPaperAirplane, HiCheckCircle } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AuthLayout from '../components/layout/AuthLayout';
import { authApi } from '../api/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setError('El correo es obligatorio');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo valido');
      return false;
    }
    setError('');
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch {
      toast.error('Error al enviar el enlace de recuperacion. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Recuperar Contrasena"
      subtitle="Te enviaremos un enlace para restablecer tu contrasena"
    >
      {sent ? (
        /* Success State */
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <HiCheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">
            Enlace enviado
          </h2>
          <p className="mb-6 text-sm text-text-secondary">
            Hemos enviado un enlace de recuperacion a{' '}
            <span className="font-medium text-text-primary">{email}</span>.
            Revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
          >
            Enviar de nuevo
          </Button>
        </div>
      ) : (
        /* Form State */
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Correo electronico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            icon={<HiEnvelope className="h-4 w-4" />}
            autoComplete="email"
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="lg"
            icon={<HiPaperAirplane className="h-4 w-4" />}
          >
            Enviar enlace
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
