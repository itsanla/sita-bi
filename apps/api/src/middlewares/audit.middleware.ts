import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const auditLog = (action: string, module: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const originalSend = res.json;

    res.json = function (data: unknown): Response {
      if (req.user?.id != null) {
        const entityId =
          req.params['id'] != null ? parseInt(req.params['id']) : null;

        prisma.log
          .create({
            data: {
              user_id: req.user.id,
              action,
              module,
              entity_id: entityId,
              ip_address: req.ip,
              user_agent: req.get('user-agent'),
              url: req.originalUrl,
              method: req.method,
              details: JSON.stringify({
                body: req.body,
                params: req.params,
                query: req.query,
              }),
              level: 'INFO',
            },
          })
          .catch((error: unknown) => {
            console.error('Audit log error:', error);
          });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};
