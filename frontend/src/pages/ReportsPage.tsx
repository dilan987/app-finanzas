import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiDocumentText,
  HiTableCells,
  HiArrowDownTray,
  HiCalendar,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Reportes y Exportación
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PDF Report */}
        <Card padding="lg">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                <HiDocumentText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Reporte PDF Mensual
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
                label="Año"
                options={getYearOptions()}
                value={pdfYear}
                onChange={(e) => setPdfYear(e.target.value)}
              />
            </div>

            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HiCalendar className="h-4 w-4" />
                <span>
                  El reporte incluirá: ingresos, gastos, balance, desglose por categoría y gráficos del período seleccionado.
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
        </Card>

        {/* CSV Export */}
        <Card padding="lg">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                <HiTableCells className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Exportar Transacciones (CSV)
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
              label="Categoría"
              options={[
                { value: '', label: 'Todas' },
                ...categories.map((c) => ({ value: c.id, label: c.name as string })),
              ]}
              value={csvCategoryId}
              onChange={(e) => setCsvCategoryId(e.target.value)}
            />

            <Select
              label="Método de pago"
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
        </Card>
      </div>
    </div>
  );
}
