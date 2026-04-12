import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
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
        // Express 5: req.query is a getter-only property, use defineProperty to override
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          configurable: true,
        });
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
