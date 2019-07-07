require('dotenv').config();

import Koa from 'koa';
import routers from './routes/index';
import { is_url } from '../util/fns';

const contentSecurityPolicy = {
  'default-src': ['self'],
  'script-src': ['self', 'unsafe-inline'],
  'style-src': ['self', 'unsafe-inline']
};

const get_csp_header = () => {
  let cspString: string = null;
  return (): string => {
    if (cspString) return cspString;
    const cspRules: string[] = Object.entries(contentSecurityPolicy).map(
      ([src, directives]) => {
        const preppedDirectives = directives.map(directive =>
          is_url(directive) || directive.startsWith('.*')
            ? directive
            : `'${directive}'`
        );
        return `${src} ${preppedDirectives.join(' ')}`;
      }
    );
    cspString = cspRules.join('; ');
    return cspString;
  };
};

const log = console.log;

export default class Application {
  private app: Koa = new Koa();
  private port: number = +process.env.PORT || 3000;

  constructor() {
    this.app.keys = ['easy-blog-sess'];
  }

  private async bootstrap(): Promise<void> {
    const cspDirectives = get_csp_header();
    const set_security_headers = (ctx: Koa.ParameterizedContext) =>
      ctx.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'deny',
        'X-XSS-Protection': '1; mode=block',
        'Content-Security-Policy': cspDirectives()
      });

    this.app.use(
      async (ctx: Koa.ParameterizedContext, next: () => Promise<void>) => {
        try {
          const start = Date.now();

          set_security_headers(ctx);

          await next();

          const xResponseTime = Date.now() - start;

          ctx.set('X-Response-Time', `${xResponseTime}ms`);
          console.log(
            `${ctx.method} ${ctx.url} (${ctx.status}) - ${xResponseTime}ms`
          );
        } catch (error) {
          ctx.throw(error);
        }
      }
    );

    this.app.on('error', err => log(err));

    await this.mount_routes();
  }

  private async mount_routes(): Promise<void> {
    for (const router of routers) {
      this.app
        .use(router.middleware.routes())
        .use(router.middleware.allowedMethods());
      log(router.allPaths);
    }
  }

  public async start(): Promise<void> {
    await this.bootstrap();
    this.app.listen(this.port, () => log('Listening on port', this.port));
  }
}
