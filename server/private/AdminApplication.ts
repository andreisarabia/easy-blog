import Koa from 'koa';
import koaBody from 'koa-body';
import KoaCSRF from 'koa-csrf';
import koaStatic from 'koa-static';
import AdminRouter from './routes/AdminRouter';
import { is_url } from '../util/fns';

const ADMIN_ASSETS_PATH = 'templates/private/assets';
const log = console.log;

export default class AdminApplication {
  private app = new Koa();
  private readonly contentSecurityPolicy = {
    'default-src': ['self'],
    'script-src': ['self', 'unsafe-inline'],
    'style-src': ['self', 'unsafe-inline'],
    'connect-src': ['self']
  };

  constructor() {
    this.setup_middlewares();
  }

  public get middleware() {
    return this.app;
  }

  private setup_middlewares(): void {
    const adminRouter = new AdminRouter();
    const cspDirectives = Object.entries(this.contentSecurityPolicy).reduce(
      (cspString, [src, directives]) => {
        const preppedDirectives = directives
          .map(directive =>
            is_url(directive) || directive.startsWith('.*')
              ? directive
              : `'${directive}'`
          )
          .join(' ');
        const directiveRule = `${src} ${preppedDirectives}`;

        return cspString
          ? `${cspString}; ${directiveRule}`
          : `${directiveRule}`;
      },
      ''
    );

    this.app.keys = ['easy-blog-admin'];

    this.app
      .use(koaBody({ json: true, multipart: true }))
      .use(new KoaCSRF())
      .use(async (ctx, next) => {
        const start = Date.now();

        ctx.set({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'deny',
          'X-XSS-Protection': '1; mode=block',
          'Content-Security-Policy': cspDirectives
        });

        await next();

        const xResponseTime = Date.now() - start;

        ctx.set('X-Response-Time', `${xResponseTime}ms`);

        if (ctx.session) {
          ctx.session.views = ctx.session.views + 1 || 1;
          log('Views:', ctx.session.views);
        }

        log(`${ctx.method} ${ctx.url} (${ctx.status}) - ${xResponseTime}ms`);
      })
      .use(adminRouter.middleware.routes())
      .use(adminRouter.middleware.allowedMethods())
      .use(koaStatic(ADMIN_ASSETS_PATH, { defer: true }));
  }
}
