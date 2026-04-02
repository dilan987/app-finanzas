import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiEnvelope, HiPaperAirplane, HiCheckCircle } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
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
          {sent ? (
            /* Success State */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <HiCheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Enlace enviado
              </h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Hemos enviado un enlace de recuperacion a{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
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
            <>
              <h2 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
                Recuperar contrasena
              </h2>
              <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Ingresa tu correo electronico y te enviaremos un enlace para restablecer tu
                contrasena.
              </p>

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
                  Enviar Enlace de Recuperacion
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
