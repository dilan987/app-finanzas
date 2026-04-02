import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponsePayload<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): void {
  const payload: ApiResponsePayload<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(payload);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message = 'Success',
): void {
  const payload: ApiResponsePayload<T[]> = {
    success: true,
    data,
    message,
    pagination,
  };
  res.status(200).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Record<string, string[]>,
): void {
  const payload: ApiResponsePayload<null> & { errors?: Record<string, string[]> } = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  res.status(statusCode).json(payload);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
