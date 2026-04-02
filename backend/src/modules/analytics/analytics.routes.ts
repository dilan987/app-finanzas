import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  summaryQuerySchema,
  trendQuerySchema,
  recommendationsQuerySchema,
  recommendationIdParamsSchema,
} from './analytics.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/analytics/summary:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Obtener resumen financiero mensual
 *     description: Retorna ingresos, gastos, balance, tasa de ahorro y comparación con el mes anterior.
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
 *         description: Resumen financiero
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     month:
 *                       type: integer
 *                     year:
 *                       type: integer
 *                     totalIncome:
 *                       type: number
 *                     totalExpenses:
 *                       type: number
 *                     balance:
 *                       type: number
 *                     savingsRate:
 *                       type: number
 *                     previousMonth:
 *                       type: object
 *                       properties:
 *                         totalIncome:
 *                           type: number
 *                         totalExpenses:
 *                           type: number
 *                         balance:
 *                           type: number
 *                         savingsRate:
 *                           type: number
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         incomeChange:
 *                           type: number
 *                         expenseChange:
 *                           type: number
 *                         balanceChange:
 *                           type: number
 *                         savingsRateChange:
 *                           type: number
 *                 message:
 *                   type: string
 *       401:
 *         description: Autenticación requerida
 *       422:
 *         description: Error de validación
 */
router.get(
  '/summary',
  validate({ query: summaryQuerySchema }),
  (req, res, next) => analyticsController.getSummary(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/analytics/category-breakdown:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Obtener desglose por categoría
 *     description: Retorna el gasto por cada categoría, porcentaje del total y comparación con el mes anterior.
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
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *     responses:
 *       200:
 *         description: Desglose por categoría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoryId:
 *                         type: string
 *                       categoryName:
 *                         type: string
 *                       categoryIcon:
 *                         type: string
 *                       categoryColor:
 *                         type: string
 *                       totalSpent:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       previousMonthTotal:
 *                         type: number
 *                       changePercentage:
 *                         type: number
 *                 message:
 *                   type: string
 *       401:
 *         description: Autenticación requerida
 *       422:
 *         description: Error de validación
 */
router.get(
  '/category-breakdown',
  validate({ query: summaryQuerySchema }),
  (req, res, next) => analyticsController.getCategoryBreakdown(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/analytics/trend:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Obtener tendencia mensual
 *     description: Retorna ingresos, gastos y tasa de ahorro de los últimos N meses.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 6
 *         description: Cantidad de meses a consultar (por defecto 6)
 *     responses:
 *       200:
 *         description: Tendencia mensual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: integer
 *                       year:
 *                         type: integer
 *                       totalIncome:
 *                         type: number
 *                       totalExpenses:
 *                         type: number
 *                       balance:
 *                         type: number
 *                       savingsRate:
 *                         type: number
 *                 message:
 *                   type: string
 *       401:
 *         description: Autenticación requerida
 */
router.get(
  '/trend',
  validate({ query: trendQuerySchema }),
  (req, res, next) => analyticsController.getTrend(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/analytics/generate-recommendations:
 *   post:
 *     tags:
 *       - Analytics
 *     summary: Generar recomendaciones financieras
 *     description: Analiza los datos del usuario y genera recomendaciones personalizadas basadas en patrones de gasto.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recomendaciones generadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     generated:
 *                       type: integer
 *                       example: 3
 *                 message:
 *                   type: string
 *       401:
 *         description: Autenticación requerida
 */
router.post(
  '/generate-recommendations',
  (req, res, next) => analyticsController.generateRecommendations(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/analytics/recommendations:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Obtener recomendaciones
 *     description: Retorna las recomendaciones almacenadas del usuario.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filtrar solo recomendaciones no leídas
 *     responses:
 *       200:
 *         description: Lista de recomendaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       message:
 *                         type: string
 *                       severity:
 *                         type: string
 *                         enum: [INFO, WARNING, CRITICAL]
 *                       category:
 *                         type: string
 *                       isRead:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *       401:
 *         description: Autenticación requerida
 */
router.get(
  '/recommendations',
  validate({ query: recommendationsQuerySchema }),
  (req, res, next) => analyticsController.getRecommendations(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/analytics/recommendations/{id}/read:
 *   patch:
 *     tags:
 *       - Analytics
 *     summary: Marcar recomendación como leída
 *     description: Marca una recomendación específica como leída.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la recomendación
 *     responses:
 *       200:
 *         description: Recomendación marcada como leída
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     isRead:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *       401:
 *         description: Autenticación requerida
 *       404:
 *         description: Recomendación no encontrada
 */
router.patch(
  '/recommendations/:id/read',
  validate({ params: recommendationIdParamsSchema }),
  (req, res, next) => analyticsController.markRecommendationRead(req as AuthenticatedRequest, res, next),
);

export default router;
