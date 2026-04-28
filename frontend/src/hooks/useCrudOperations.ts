import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface CrudApi<TItem, TCreate, TUpdate> {
  getAll: (...args: any[]) => Promise<{ data: { data: TItem[] } }>;
  create: (data: TCreate) => Promise<{ data: { data: TItem } }>;
  update: (id: string, data: TUpdate) => Promise<{ data: { data: TItem } }>;
  delete: (id: string) => Promise<unknown>;
}

interface UseCrudReturn<TItem, TCreate, TUpdate> {
  items: TItem[];
  setItems: React.Dispatch<React.SetStateAction<TItem[]>>;
  loading: boolean;
  loadData: (...args: any[]) => Promise<void>;
  handleCreate: (data: TCreate) => Promise<TItem | null>;
  handleUpdate: (id: string, data: TUpdate) => Promise<TItem | null>;
  handleDelete: (id: string) => Promise<boolean>;
}

interface CrudMessages {
  loadError?: string;
  createSuccess?: string;
  createError?: string;
  updateSuccess?: string;
  updateError?: string;
  deleteSuccess?: string;
  deleteError?: string;
}

export function useCrudOperations<TItem extends { id: string }, TCreate, TUpdate>(
  api: CrudApi<TItem, TCreate, TUpdate>,
  messages?: CrudMessages,
): UseCrudReturn<TItem, TCreate, TUpdate> {
  const [items, setItems] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (...args: any[]) => {
    try {
      const res = await api.getAll(...args);
      setItems(res.data.data);
    } catch {
      toast.error(messages?.loadError ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [api, messages?.loadError]);

  const handleCreate = useCallback(async (data: TCreate): Promise<TItem | null> => {
    try {
      const res = await api.create(data);
      const created = res.data.data;
      setItems((prev) => [...prev, created]);
      toast.success(messages?.createSuccess ?? 'Creado exitosamente');
      return created;
    } catch {
      toast.error(messages?.createError ?? 'Error al crear');
      return null;
    }
  }, [api, messages]);

  const handleUpdate = useCallback(async (id: string, data: TUpdate): Promise<TItem | null> => {
    try {
      const res = await api.update(id, data);
      const updated = res.data.data;
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success(messages?.updateSuccess ?? 'Actualizado exitosamente');
      return updated;
    } catch {
      toast.error(messages?.updateError ?? 'Error al actualizar');
      return null;
    }
  }, [api, messages]);

  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success(messages?.deleteSuccess ?? 'Eliminado exitosamente');
      return true;
    } catch {
      toast.error(messages?.deleteError ?? 'Error al eliminar');
      return false;
    }
  }, [api, messages]);

  return { items, setItems, loading, loadData, handleCreate, handleUpdate, handleDelete };
}
