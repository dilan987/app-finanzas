import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { authMiddleware } from './middlewares/auth.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { generalLimiter, authLimiter } from './middlewares/rateLimiter.middleware';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import budgetsRoutes from './modules/budgets/budgets.routes';
import recurringRoutes from './modules/recurring/recurring.routes';
import investmentsRoutes from './modules/investments/investments.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import reportsRoutes from './modules/reports/reports.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);

// API docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/categories', authMiddleware, categoriesRoutes);
app.use('/api/transactions', authMiddleware, transactionsRoutes);
app.use('/api/budgets', authMiddleware, budgetsRoutes);
app.use('/api/recurring', authMiddleware, recurringRoutes);
app.use('/api/investments', authMiddleware, investmentsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);

// Error handling
app.use(errorMiddleware);

export default app;
