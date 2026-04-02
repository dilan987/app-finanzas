import { Response, NextFunction } from 'express';
import * as reportsService from './reports.service';
import { AuthenticatedRequest } from '../../types';
import { getMonthName } from '../../utils/helpers';

interface PDFQuery {
  month: number;
  year: number;
}

interface CSVQuery {
  type?: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export async function getPDF(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { month, year } = req.query as unknown as PDFQuery;
    const buffer = await reportsService.generatePDF(req.userId, month, year);

    const monthName = getMonthName(month);
    const filename = `reporte_${monthName}_${year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function getCSV(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as CSVQuery;
    const csv = await reportsService.generateCSV(req.userId, filters);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `transacciones_${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // BOM for Excel UTF-8 compatibility
    res.send('\uFEFF' + csv);
  } catch (error) {
    next(error);
  }
}
