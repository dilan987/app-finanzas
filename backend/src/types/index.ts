import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
