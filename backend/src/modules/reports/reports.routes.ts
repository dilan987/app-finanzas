import { Router } from 'express';
import * as reportsController from './reports.controller';
import { validate } from '../../middlewares/validate.middleware';
import { pdfQuerySchema, csvQuerySchema } from './reports.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/reports/pdf:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Descargar reporte PDF mensual
 *     description: Genera y descarga un reporte PDF con resumen de ingresos, gastos, top categorías y tasa de ahorro.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mes (1-12)
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *         description: Año (2000-2100)
 *     responses:
 *       200:
 *         description: Archivo PDF generado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: attachment; filename="reporte_Marzo_2026.pdf"
 *       401:
 *         description: Autenticación requerida
 *       422:
 *         description: Error de validación
 */
router.get(
  '/pdf',
  validate({ query: pdfQuerySchema }),
  (req, res, next) => reportsController.getPDF(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/reports/csv:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Descargar transacciones en CSV
 *     description: Genera y descarga un archivo CSV con las transacciones filtradas. Columnas - Fecha, Tipo, Categoría, Descripción, Monto, Método de Pago, Moneda.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [CASH, DEBIT_CARD, CREDIT_CARD, TRANSFER]
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar en descripción de transacción
 *     responses:
 *       200:
 *         description: Archivo CSV generado
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: attachment; filename="transacciones_2026-03-29.csv"
 *       401:
 *         description: Autenticación requerida
 *       422:
 *         description: Error de validación
 */
router.get(
  '/csv',
  validate({ query: csvQuerySchema }),
  (req, res, next) => reportsController.getCSV(req as AuthenticatedRequest, res, next),
);

export default router;
