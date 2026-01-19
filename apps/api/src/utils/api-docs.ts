import type { Express } from 'express';

export function generateApiDocs(app: Express) {
  const routes: any[] = [];
  
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase());
      routes.push({
        path: middleware.route.path,
        methods
      });
    } else if (middleware.name === 'router') {
      const basePath = middleware.regexp.source
        .replace('\\/?', '')
        .replace('(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace(/\^/g, '')
        .replace(/\$/g, '')
        .replace(/\\/g, '');
      
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase());
          routes.push({
            path: basePath + handler.route.path,
            methods
          });
        }
      });
    }
  });

  return routes.sort((a, b) => a.path.localeCompare(b.path));
}
