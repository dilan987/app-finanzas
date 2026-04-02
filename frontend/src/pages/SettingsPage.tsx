import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiUser,
  HiLockClosed,
  HiSun,
  HiMoon,
  HiTrash,
  HiEye,
  HiEyeSlash,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { usersApi } from '../api/users.api';

const CURRENCY_OPTIONS = [
  { value: 'COP', label: 'COP - Peso colombiano' },
  { value: 'USD', label: 'USD - Dólar estadounidense' },
  { value: 'EUR', label: 'EUR - Euro' },
];

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const { theme, setTheme } = useUiStore();

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

  useEffect(() => {
    if (user) {
      setName(user.name);
      setMainCurrency(user.mainCurrency);
    }
  }, [user]);

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
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setChangingPassword(true);
    try {
      await usersApi.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Error al cambiar contraseña. Verifica tu contraseña actual.');
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración</h1>

      {/* Profile */}
      <Card padding="lg">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <HiUser className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Perfil</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Información personal</p>
            </div>
          </div>

          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />

          <Input
            label="Correo electrónico"
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
      </Card>

      {/* Change Password */}
      <Card padding="lg">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              <HiLockClosed className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Cambiar Contraseña
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Actualiza tu contraseña de acceso
              </p>
            </div>
          </div>

          <div className="relative">
            <Input
              label="Contraseña actual"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Tu contraseña actual"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showCurrentPassword ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Nueva contraseña"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              error={passwordTooShort ? 'Mínimo 8 caracteres' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showNewPassword ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contraseña"
            error={
              confirmPassword.length > 0 && !passwordsMatch
                ? 'Las contraseñas no coinciden'
                : undefined
            }
            helperText={passwordsMatch ? 'Las contraseñas coinciden' : undefined}
          />

          <div className="flex justify-end">
            <Button onClick={handleChangePassword} loading={changingPassword}>
              Cambiar Contraseña
            </Button>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card padding="lg">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
              {theme === 'dark' ? <HiMoon className="h-5 w-5" /> : <HiSun className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Apariencia</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Personaliza el aspecto de la aplicación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <HiSun className={`h-6 w-6 ${theme === 'light' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="text-left">
                <p className={`text-sm font-medium ${theme === 'light' ? 'text-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  Claro
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tema de día</p>
              </div>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <HiMoon className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              <div className="text-left">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  Oscuro
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tema de noche</p>
              </div>
            </button>
          </div>
        </div>
      </Card>

      {/* Delete Account - Danger Zone */}
      <Card padding="lg" className="border-red-200 dark:border-red-800">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
              <HiTrash className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
                Zona de Peligro
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Eliminar permanentemente tu cuenta y todos tus datos
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">
              Esta acción es irreversible. Se eliminarán todas tus transacciones, presupuestos,
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
      </Card>

      {/* First confirmation */}
      <ConfirmDialog
        isOpen={showDeleteFirst}
        onClose={() => setShowDeleteFirst(false)}
        onConfirm={() => {
          setShowDeleteFirst(false);
          setShowDeleteSecond(true);
        }}
        title="Eliminar Cuenta"
        message="¿Estás seguro de que deseas eliminar tu cuenta? Se perderán todos tus datos."
        confirmLabel="Sí, continuar"
      />

      {/* Second confirmation */}
      <ConfirmDialog
        isOpen={showDeleteSecond}
        onClose={() => setShowDeleteSecond(false)}
        onConfirm={handleDeleteAccount}
        title="Confirmación final"
        message="Esta acción NO se puede deshacer. ¿Realmente deseas eliminar tu cuenta permanentemente?"
        confirmLabel="Eliminar permanentemente"
        loading={deletingAccount}
      />
    </div>
  );
}
