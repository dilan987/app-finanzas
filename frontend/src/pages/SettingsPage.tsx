import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiUser,
  HiLockClosed,
  HiSun,
  HiMoon,
  HiTrash,
  HiEye,
  HiEyeSlash,
  HiAcademicCap,
  HiCalendarDays,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Toggle from '../components/ui/Toggle';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { usersApi } from '../api/users.api';
import { computeBiweeklyRanges } from '../utils/biweekly';

const CURRENCY_OPTIONS = [
  { value: 'COP', label: 'COP - Peso colombiano' },
  { value: 'USD', label: 'USD - Dolar estadounidense' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const TOUR_STATUS_LABEL: Record<'NOT_STARTED' | 'COMPLETED' | 'SKIPPED', string> = {
  NOT_STARTED: 'No iniciado',
  COMPLETED: 'Completado',
  SKIPPED: 'Saltado',
};

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const { theme, setTheme } = useUiStore();
  const navigate = useNavigate();
  const tourStatus = useOnboardingStore((s) => s.status);
  const restartTour = useOnboardingStore((s) => s.restart);

  // Profile state
  const [name, setName] = useState(user?.name ?? '');
  const [mainCurrency, setMainCurrency] = useState(user?.mainCurrency ?? 'COP');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteFirst, setShowDeleteFirst] = useState(false);
  const [showDeleteSecond, setShowDeleteSecond] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Biweekly state
  const [biweeklyEnabled, setBiweeklyEnabled] = useState<boolean>(user?.biweeklyCustomEnabled ?? false);
  const [biweeklyDay1, setBiweeklyDay1] = useState<number>(user?.biweeklyStartDay1 ?? 1);
  const [biweeklyDay2, setBiweeklyDay2] = useState<number>(user?.biweeklyStartDay2 ?? 16);
  const [savingBiweekly, setSavingBiweekly] = useState(false);
  const [biweeklyError, setBiweeklyError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setMainCurrency(user.mainCurrency);
      setBiweeklyEnabled(user.biweeklyCustomEnabled ?? false);
      if (user.biweeklyStartDay1 != null) setBiweeklyDay1(user.biweeklyStartDay1);
      if (user.biweeklyStartDay2 != null) setBiweeklyDay2(user.biweeklyStartDay2);
    }
  }, [user]);

  const validateBiweekly = (): string | null => {
    if (!biweeklyEnabled) return null;
    if (!Number.isInteger(biweeklyDay1) || !Number.isInteger(biweeklyDay2)) {
      return 'Los días deben ser números enteros';
    }
    if (biweeklyDay1 < 1 || biweeklyDay1 > 31 || biweeklyDay2 < 1 || biweeklyDay2 > 31) {
      return 'Los días deben estar entre 1 y 31';
    }
    if (biweeklyDay1 === biweeklyDay2) {
      return 'Los días de inicio deben ser diferentes';
    }
    return null;
  };

  const handleSaveBiweekly = async () => {
    const err = validateBiweekly();
    if (err) {
      setBiweeklyError(err);
      return;
    }
    setBiweeklyError(null);
    setSavingBiweekly(true);
    try {
      const res = await usersApi.updateProfile({
        biweeklyCustomEnabled: biweeklyEnabled,
        biweeklyStartDay1: biweeklyEnabled ? biweeklyDay1 : null,
        biweeklyStartDay2: biweeklyEnabled ? biweeklyDay2 : null,
      });
      setUser(res.data.data);
      toast.success('Configuración de quincenas guardada');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSavingBiweekly(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await usersApi.updateProfile({
        name: name.trim(),
        mainCurrency,
      });
      setUser(res.data.data);
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al actualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La contrasena debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contrasenas no coinciden');
      return;
    }
    setChangingPassword(true);
    try {
      await usersApi.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success('Contrasena actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Error al cambiar contrasena. Verifica tu contrasena actual.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteSecond(false);
    setDeletingAccount(true);
    try {
      await usersApi.deleteAccount();
      toast.success('Cuenta eliminada');
      await logout();
    } catch {
      toast.error('Error al eliminar cuenta');
    } finally {
      setDeletingAccount(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Configuracion</h1>
        <p className="mt-1 text-sm text-text-secondary">Administra tu cuenta y preferencias</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
              <HiUser className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Perfil</h2>
              <p className="text-sm text-text-secondary">Informacion personal</p>
            </div>
          </div>

          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />

          <Input
            label="Correo electronico"
            value={user?.email ?? ''}
            disabled
            helperText="El correo no se puede cambiar"
          />

          <Select
            label="Moneda principal"
            options={CURRENCY_OPTIONS}
            value={mainCurrency}
            onChange={(e) => setMainCurrency(e.target.value)}
          />

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} loading={savingProfile}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>

      {/* Appearance Card */}
      <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-invest-bg text-invest dark:bg-[rgba(139,92,246,0.12)] dark:text-invest-light">
              {theme === 'dark' ? <HiMoon className="h-5 w-5" /> : <HiSun className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Apariencia</h2>
              <p className="text-sm text-text-secondary">
                Personaliza el aspecto de la aplicacion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                theme === 'light'
                  ? 'border-primary-500 bg-primary-50 shadow-card dark:bg-primary-950/20'
                  : 'border-border-primary hover:border-text-tertiary'
              }`}
            >
              <HiSun className={`h-6 w-6 ${theme === 'light' ? 'text-primary-600 dark:text-primary-400' : 'text-text-tertiary'}`} />
              <div className="text-left">
                <p className={`text-sm font-medium ${theme === 'light' ? 'text-primary-700 dark:text-primary-300' : 'text-text-secondary'}`}>
                  Claro
                </p>
                <p className="text-xs text-text-tertiary">Tema de dia</p>
              </div>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                theme === 'dark'
                  ? 'border-primary-500 bg-primary-50 shadow-card dark:bg-primary-950/20'
                  : 'border-border-primary hover:border-text-tertiary'
              }`}
            >
              <HiMoon className={`h-6 w-6 ${theme === 'dark' ? 'text-primary-600 dark:text-primary-400' : 'text-text-tertiary'}`} />
              <div className="text-left">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-700 dark:text-primary-300' : 'text-text-secondary'}`}>
                  Oscuro
                </p>
                <p className="text-xs text-text-tertiary">Tema de noche</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Biweekly Config Card */}
      <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
              <HiCalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Quincenas</h2>
              <p className="text-sm text-text-secondary">
                Configura los días que separan tus quincenas según tus ciclos de cobro
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-secondary p-4 dark:bg-surface-tertiary">
            <div>
              <p className="text-sm font-medium text-text-primary">Personalizar mis cortes</p>
              <p className="mt-1 text-xs text-text-secondary">
                Por defecto: Q1 días 1–15, Q2 días 16–fin del mes
              </p>
            </div>
            <Toggle checked={biweeklyEnabled} onChange={setBiweeklyEnabled} />
          </div>

          {biweeklyEnabled ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Día de inicio Q1"
                  type="number"
                  min={1}
                  max={31}
                  value={String(biweeklyDay1)}
                  onChange={(e) => setBiweeklyDay1(Number(e.target.value))}
                />
                <Input
                  label="Día de inicio Q2"
                  type="number"
                  min={1}
                  max={31}
                  value={String(biweeklyDay2)}
                  onChange={(e) => setBiweeklyDay2(Number(e.target.value))}
                />
              </div>

              {/* Live preview */}
              {(() => {
                const err = validateBiweekly();
                if (err) {
                  return (
                    <p className="rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning-dark dark:border-warning-light/20 dark:bg-[rgba(245,158,11,0.08)] dark:text-warning-light">
                      {err}
                    </p>
                  );
                }
                const now = new Date();
                const ranges = computeBiweeklyRanges(
                  now.getMonth() + 1,
                  now.getFullYear(),
                  'custom',
                  biweeklyDay1,
                  biweeklyDay2,
                );
                return (
                  <div className="rounded-md bg-primary-50 px-3 py-2 text-xs text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
                    <strong>Vista previa para este mes:</strong>{' '}
                    Primera quincena {ranges.q1.label}; Segunda quincena {ranges.q2.label}.
                  </div>
                );
              })()}
            </>
          ) : null}

          {biweeklyError ? (
            <p className="text-xs text-expense dark:text-expense-light">{biweeklyError}</p>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={handleSaveBiweekly} loading={savingBiweekly}>
              Guardar quincenas
            </Button>
          </div>
        </div>
      </div>

      {/* Onboarding Tour Card */}
      <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
              <HiAcademicCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Tour de bienvenida</h2>
              <p className="text-sm text-text-secondary">
                Recorrido guiado por las secciones de la app
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-secondary p-4 dark:bg-surface-tertiary">
            <div>
              <p className="text-sm font-medium text-text-primary">Estado actual</p>
              <p className="mt-1 text-xs text-text-secondary">
                {TOUR_STATUS_LABEL[tourStatus]}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                await restartTour();
                navigate('/dashboard');
                toast.success('Tour reiniciado');
              }}
            >
              Reiniciar tour de bienvenida
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-bg text-warning-dark dark:bg-[rgba(245,158,11,0.12)] dark:text-warning-light">
              <HiLockClosed className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Cambiar Contrasena
              </h2>
              <p className="text-sm text-text-secondary">
                Actualiza tu contrasena de acceso
              </p>
            </div>
          </div>

          <div className="relative">
            <Input
              label="Contrasena actual"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Tu contrasena actual"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-8 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label={showCurrentPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            >
              {showCurrentPassword ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Nueva contrasena"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              error={passwordTooShort ? 'Minimo 8 caracteres' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-8 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label={showNewPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            >
              {showNewPassword ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            label="Confirmar nueva contrasena"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contrasena"
            error={
              confirmPassword.length > 0 && !passwordsMatch
                ? 'Las contrasenas no coinciden'
                : undefined
            }
            helperText={passwordsMatch ? 'Las contrasenas coinciden' : undefined}
          />

          <div className="flex justify-end">
            <Button onClick={handleChangePassword} loading={changingPassword}>
              Cambiar Contrasena
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account - Danger Zone */}
      <div className="rounded-xl border border-expense/30 bg-surface-card p-6 shadow-card dark:border-expense-light/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light">
              <HiTrash className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-expense dark:text-expense-light">
                Zona de Peligro
              </h2>
              <p className="text-sm text-text-secondary">
                Eliminar permanentemente tu cuenta y todos tus datos
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-expense/20 bg-expense-bg p-4 dark:border-expense-light/10 dark:bg-[rgba(239,68,68,0.06)]">
            <p className="text-sm text-expense dark:text-expense-light">
              Esta accion es irreversible. Se eliminaran todas tus transacciones, presupuestos,
              inversiones y configuraciones de forma permanente.
            </p>
          </div>

          <Button
            variant="danger"
            onClick={() => setShowDeleteFirst(true)}
            loading={deletingAccount}
          >
            Eliminar Cuenta
          </Button>
        </div>
      </div>

      {/* First confirmation */}
      <ConfirmDialog
        isOpen={showDeleteFirst}
        onClose={() => setShowDeleteFirst(false)}
        onConfirm={() => {
          setShowDeleteFirst(false);
          setShowDeleteSecond(true);
        }}
        title="Eliminar Cuenta"
        message="Estas seguro de que deseas eliminar tu cuenta? Se perderan todos tus datos."
        confirmLabel="Si, continuar"
      />

      {/* Second confirmation */}
      <ConfirmDialog
        isOpen={showDeleteSecond}
        onClose={() => setShowDeleteSecond(false)}
        onConfirm={handleDeleteAccount}
        title="Confirmacion final"
        message="Esta accion NO se puede deshacer. Realmente deseas eliminar tu cuenta permanentemente?"
        confirmLabel="Eliminar permanentemente"
        loading={deletingAccount}
      />
    </div>
  );
}
