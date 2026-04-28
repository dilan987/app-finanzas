import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseDeleteConfirmReturn {
  deleteId: string | null;
  deleting: boolean;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

export function useDeleteConfirm(
  deleteFn: (id: string) => Promise<unknown>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: () => void;
  },
): UseDeleteConfirmReturn {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const requestDelete = useCallback((id: string) => setDeleteId(id), []);
  const cancelDelete = useCallback(() => setDeleteId(null), []);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteFn(deleteId);
      toast.success(options?.successMessage ?? 'Eliminado exitosamente');
      setDeleteId(null);
      options?.onSuccess?.();
    } catch {
      toast.error(options?.errorMessage ?? 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  }, [deleteId, deleteFn, options]);

  return { deleteId, deleting, requestDelete, cancelDelete, confirmDelete };
}
