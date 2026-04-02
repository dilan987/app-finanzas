import api from './axiosInstance';

interface ReportParams {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const reportsApi = {
  async downloadPdf(params?: ReportParams): Promise<void> {
    const response = await api.get<Blob>('/reports/pdf', {
      params,
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    let filename = 'reporte-financiero.pdf';
    if (contentDisposition) {
      const match = /filename="?([^";\n]+)"?/.exec(contentDisposition);
      if (match?.[1]) {
        filename = match[1];
      }
    }

    downloadBlob(response.data, filename);
  },

  async downloadCsv(params?: ReportParams): Promise<void> {
    const response = await api.get<Blob>('/reports/csv', {
      params,
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    let filename = 'transacciones.csv';
    if (contentDisposition) {
      const match = /filename="?([^";\n]+)"?/.exec(contentDisposition);
      if (match?.[1]) {
        filename = match[1];
      }
    }

    downloadBlob(response.data, filename);
  },
};
