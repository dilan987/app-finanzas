import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiDocumentText,
  HiTableCells,
  HiArrowDownTray,
  HiCalendar,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import DatePicker from '../components/ui/DatePicker';
import { reportsApi } from '../api/reports.api';
import { categoriesApi } from '../api/categories.api';
import { PAYMENT_METHODS } from '../utils/constants';
import { useUiStore } from '../store/uiStore';
import { useEffect, useCallback } from 'react';
import type { Category } from '../types';

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

const MONTHS = MONTH_LABELS.map((label, i) => ({
  value: String(i + 1),
  label,
}));

function getYearOptions(): { value: string; label: string }[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const y = current - i;
    return { value: String(y), label: String(y) };
  });
}

export default function ReportsPage() {
  const { currentMonth, currentYear } = useUiStore();

  // PDF state
  const [pdfMonth, setPdfMonth] = useState(String(currentMonth));
  const [pdfYear, setPdfYear] = useState(String(currentYear));
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // CSV state
  const [csvType, setCsvType] = useState('');
  const [csvCategoryId, setCsvCategoryId] = useState('');
  const [csvPaymentMethod, setCsvPaymentMethod] = useState('');
  const [csvStartDate, setCsvStartDate] = useState('');
  const [csvEndDate, setCsvEndDate] = useState('');
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data.data);
    } catch {
      // Silent fail for categories
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await reportsApi.downloadPdf({
        month: parseInt(pdfMonth, 10),
        year: parseInt(pdfYear, 10),
      });
      toast.success('Reporte PDF descargado');
    } catch {
      toast.error('Error al descargar el reporte PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const params: Record<string, string | number | undefined> = {};
      if (csvStartDate) params.startDate = csvStartDate;
      if (csvEndDate) params.endDate = csvEndDate;
      await reportsApi.downloadCsv(params as { startDate?: string; endDate?: string });
      toast.success('Archivo CSV descargado');
    } catch {
      toast.error('Error al descargar el archivo CSV');
    } finally {
      setDownloadingCsv(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Reportes y Exportacion
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Genera reportes y exporta tus datos financieros
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PDF Report */}
        <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-expense-bg text-expense dark:bg-[rgba(239,68,68,0.12)] dark:text-expense-light">
                <HiDocumentText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Reporte PDF Mensual
                </h2>
                <p className="text-sm text-text-secondary">
                  Genera un resumen completo de tus finanzas del mes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Mes"
                options={MONTHS}
                value={pdfMonth}
                onChange={(e) => setPdfMonth(e.target.value)}
              />
              <Select
                label="Ano"
                options={getYearOptions()}
                value={pdfYear}
                onChange={(e) => setPdfYear(e.target.value)}
              />
            </div>

            <div className="rounded-lg bg-surface-tertiary p-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <HiCalendar className="h-4 w-4 shrink-0" />
                <span>
                  El reporte incluira: ingresos, gastos, balance, desglose por categoria y graficos del periodo seleccionado.
                </span>
              </div>
            </div>

            <Button
              icon={<HiArrowDownTray className="h-4 w-4" />}
              onClick={handleDownloadPdf}
              loading={downloadingPdf}
              fullWidth
              size="lg"
            >
              Descargar PDF
            </Button>
          </div>
        </div>

        {/* CSV Export */}
        <div className="rounded-xl border border-border-primary bg-surface-card p-6 shadow-card">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-income-bg text-income dark:bg-[rgba(5,150,105,0.12)] dark:text-income-light">
                <HiTableCells className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Exportar Transacciones (CSV)
                </h2>
                <p className="text-sm text-text-secondary">
                  Descarga tus transacciones en formato CSV
                </p>
              </div>
            </div>

            <Select
              label="Tipo"
              options={[
                { value: '', label: 'Todos' },
                { value: 'INCOME', label: 'Ingresos' },
                { value: 'EXPENSE', label: 'Gastos' },
              ]}
              value={csvType}
              onChange={(e) => setCsvType(e.target.value)}
            />

            <Select
              label="Categoria"
              options={[
                { value: '', label: 'Todas' },
                ...categories.map((c) => ({ value: c.id, label: c.name as string })),
              ]}
              value={csvCategoryId}
              onChange={(e) => setCsvCategoryId(e.target.value)}
            />

            <Select
              label="Metodo de pago"
              options={[
                { value: '', label: 'Todos' },
                ...PAYMENT_METHODS,
              ]}
              value={csvPaymentMethod}
              onChange={(e) => setCsvPaymentMethod(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Fecha inicio"
                value={csvStartDate}
                onChange={(e) => setCsvStartDate(e.target.value)}
              />
              <DatePicker
                label="Fecha fin"
                value={csvEndDate}
                onChange={(e) => setCsvEndDate(e.target.value)}
              />
            </div>

            <Button
              icon={<HiArrowDownTray className="h-4 w-4" />}
              onClick={handleDownloadCsv}
              loading={downloadingCsv}
              fullWidth
              size="lg"
              variant="success"
            >
              Descargar CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
