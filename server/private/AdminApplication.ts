import Koa from 'koa';
import koaStatic from 'koa-static';
import Application, { ContentSecurityPolicy } from '../src/Application';
import AdminRouter from './routes/AdminRouter';
import csrf_middleware from '../src/middleware/csrf';
import { is_url } from '../util/fns';

const ADMIN_ASSETS_PATH = 'templates/private/assets';
const log = console.log;

class AdminApplication extends Application {
  protected app = new Koa();
  protected csp: ContentSecurityPolicy = {
    'default-src': ['self'],
    'script-src': ['self', 'unsafe-inline'],
    'style-src': ['self', 'unsafe-inline'],
    'connect-src': ['self']
  };

  constructor() {
    super();
    this.setup_middlewares();
  }

  protected setup_middlewares(): void {
    const defaultHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'deny',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': super.cspHeader
    };

    this.app.keys = ['easy-blog-admin'];

    this.app
      .use(csrf_middleware())
      .use(async (ctx, next) => {
        const start = Date.now();

        ctx.set(defaultHeaders);

        await next();

        const xResponseTime = Date.now() - start;

        ctx.set('X-Response-Time', `${xResponseTime}ms`);

        if (ctx.session) {
          ctx.session.views = ctx.session.views + 1 || 1;
          log('Views:', ctx.session.views);
        }

        log(`${ctx.method} ${ctx.path} (${ctx.status}) - ${xResponseTime}ms`);
      })
      .use(AdminRouter.middleware.routes())
      .use(AdminRouter.middleware.allowedMethods())
      .use(koaStatic(ADMIN_ASSETS_PATH, { defer: true }));
  }
}

export default new AdminApplication();
