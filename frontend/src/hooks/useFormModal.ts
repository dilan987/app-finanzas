import { useState, useCallback } from 'react';

interface UseFormModalReturn<TForm> {
  isOpen: boolean;
  editingId: string | null;
  form: TForm;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  setForm: React.Dispatch<React.SetStateAction<TForm>>;
  openCreate: () => void;
  openEdit: (id: string, formData: TForm) => void;
  close: () => void;
}

export function useFormModal<TForm>(initialForm: TForm): UseFormModalReturn<TForm> {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TForm>(initialForm);
  const [saving, setSaving] = useState(false);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(initialForm);
    setIsOpen(true);
  }, [initialForm]);

  const openEdit = useCallback((id: string, formData: TForm) => {
    setEditingId(id);
    setForm(formData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingId(null);
    setSaving(false);
  }, []);

  return { isOpen, editingId, form, saving, setSaving, setForm, openCreate, openEdit, close };
}
