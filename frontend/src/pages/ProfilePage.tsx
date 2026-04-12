import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiUser, HiEnvelope, HiCurrencyDollar, HiPencilSquare } from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
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

  const initials = (user?.name ?? '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Mi Perfil</h1>
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
      <div className="rounded-xl border border-border-primary bg-surface-card p-8 shadow-card">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
            {initials ? (
              <span className="text-2xl font-bold">{initials}</span>
            ) : (
              <HiUser className="h-10 w-10" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {user?.name}
            </h2>
            <p className="text-sm text-text-secondary">{user?.email}</p>
            <p className="mt-1 text-xs text-text-tertiary">
              {CURRENCY_OPTIONS.find((c) => c.value === user?.mainCurrency)?.label ?? user?.mainCurrency}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
              <HiUser className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Informacion Personal
              </h2>
              <p className="text-sm text-text-secondary">
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
            <div className="divide-y divide-border-primary">
              <div className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-tertiary">
                  <HiUser className="h-5 w-5 text-text-tertiary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">Nombre completo</p>
                  <p className="mt-0.5 text-sm font-medium text-text-primary">
                    {user?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-tertiary">
                  <HiEnvelope className="h-5 w-5 text-text-tertiary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">Correo electronico</p>
                  <p className="mt-0.5 text-sm font-medium text-text-primary">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-tertiary">
                  <HiCurrencyDollar className="h-5 w-5 text-text-tertiary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">Moneda principal</p>
                  <p className="mt-0.5 text-sm font-medium text-text-primary">
                    {CURRENCY_OPTIONS.find((c) => c.value === user?.mainCurrency)?.label ?? user?.mainCurrency}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
