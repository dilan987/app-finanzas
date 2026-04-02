import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiUser, HiEnvelope, HiCurrencyDollar, HiPencilSquare } from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../api/users.api';

const CURRENCY_OPTIONS = [
  { value: 'COP', label: 'COP - Peso colombiano' },
  { value: 'USD', label: 'USD - Dolar estadounidense' },
  { value: 'EUR', label: 'EUR - Euro' },
];

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [mainCurrency, setMainCurrency] = useState(user?.mainCurrency ?? 'COP');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(!user);

  useEffect(() => {
    if (!user) {
      setLoadingProfile(true);
      usersApi
        .getProfile()
        .then((res) => {
          const profile = res.data.data;
          setUser(profile);
          setName(profile.name);
          setMainCurrency(profile.mainCurrency);
        })
        .catch(() => toast.error('Error al cargar el perfil'))
        .finally(() => setLoadingProfile(false));
    }
  }, [user, setUser]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setMainCurrency(user.mainCurrency);
    }
  }, [user]);

  function handleCancel() {
    if (user) {
      setName(user.name);
      setMainCurrency(user.mainCurrency);
    }
    setEditing(false);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const res = await usersApi.updateProfile({
        name: name.trim(),
        mainCurrency,
      });
      setUser(res.data.data);
      toast.success('Perfil actualizado');
      setEditing(false);
    } catch {
      toast.error('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi Perfil</h1>
        {!editing && (
          <Button
            variant="secondary"
            size="sm"
            icon={<HiPencilSquare className="h-4 w-4" />}
            onClick={() => setEditing(true)}
          >
            Editar
          </Button>
        )}
      </div>

      {/* Profile Avatar & Name */}
      <Card padding="lg">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <HiUser className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Profile Details */}
      <Card padding="lg">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <HiUser className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Informacion Personal
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Datos de tu cuenta
              </p>
            </div>
          </div>

          {editing ? (
            <>
              <Input
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                icon={<HiUser className="h-4 w-4" />}
                disabled={saving}
              />

              <Input
                label="Correo electronico"
                value={user?.email ?? ''}
                disabled
                icon={<HiEnvelope className="h-4 w-4" />}
                helperText="El correo no se puede cambiar"
              />

              <Select
                label="Moneda principal"
                options={CURRENCY_OPTIONS}
                value={mainCurrency}
                onChange={(e) => setMainCurrency(e.target.value)}
              />

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  Guardar Cambios
                </Button>
              </div>
            </>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              <div className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <HiUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nombre completo</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <HiEnvelope className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Correo electronico</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <HiCurrencyDollar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Moneda principal</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                    {CURRENCY_OPTIONS.find((c) => c.value === user?.mainCurrency)?.label ?? user?.mainCurrency}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
