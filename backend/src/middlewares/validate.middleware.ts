import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        mergeZodErrors(result.error, errors, 'body');
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        mergeZodErrors(result.error, errors, 'query');
      } else {
        req.query = result.data as Record<string, string>;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        mergeZodErrors(result.error, errors, 'params');
      } else {
        req.params = result.data as Record<string, string>;
      }
    }

    if (Object.keys(errors).length > 0) {
      next(new ValidationError(errors));
      return;
    }

    next();
  };
}

function mergeZodErrors(
  zodError: ZodError,
  target: Record<string, string[]>,
  prefix: string,
): void {
  for (const issue of zodError.issues) {
    const path = issue.path.length > 0
      ? `${prefix}.${issue.path.join('.')}`
      : prefix;

    if (!target[path]) {
      target[path] = [];
    }
    target[path].push(issue.message);
  }
}
