import { Response, NextFunction } from 'express';
import { TransactionType } from '@prisma/client';
import * as categoriesService from './categories.service';
import { sendSuccess, sendNoContent } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const type = req.query.type as TransactionType | undefined;
    const categories = await categoriesService.getAll(req.userId, type);
    sendSuccess(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await categoriesService.getById(req.params.id as string, req.userId);
    sendSuccess(res, category, 'Category retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = req.body as CreateCategoryInput;
    const category = await categoriesService.create(req.userId, data);
    sendSuccess(res, category, 'Category created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = req.body as UpdateCategoryInput;
    const category = await categoriesService.update(req.params.id as string, req.userId, data);
    sendSuccess(res, category, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await categoriesService.remove(req.params.id as string, req.userId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}
