import type { Request, Response, NextFunction } from 'express';
import { ZodError, type z } from 'zod';

export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: 'gagal',
          message: 'Validasi gagal',
          errors: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      res.status(400).json({
        status: 'gagal',
        message: 'Data request tidak valid',
      });
    }
  };
};

export const validateRequest = validate;
