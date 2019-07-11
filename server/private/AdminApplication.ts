import koaStatic from 'koa-static';
import koaBody from 'koa-body';
import KoaCSRF from 'koa-csrf';
import koaSession from 'koa-session';
import Application from '../src/Application';
import AdminRouter from './routes/AdminRouter';
import { is_url } from '../util/fns';

const log = console.log;

export default class AdminApplication extends Application {
  private readonly contentSecurityPolicy = {
    'default-src': ['self'],
    'script-src': ['self', 'unsafe-inline'],
    'style-src': ['self', 'unsafe-inline']
  };
  private readonly sessionConfig = {
    key: 'easy-blog-admin:sess',
    httpOnly: true
  };
  protected appPaths: Set<string>;

  constructor() {
    super();
    this.app.keys = ['easy-blog-admin'];
  }

  private async setup_middlewares(): Promise<void> {
    const adminRouter = new AdminRouter();
    this.appPaths = new Set([...adminRouter.allPaths.keys()]);

    const cspRules = Object.entries(this.contentSecurityPolicy)
      .map(([src, directives]) => {
        const preppedDirectives = directives.map(directive =>
          is_url(directive) || directive.startsWith('.*')
            ? directive
            : `'${directive}'`
        );

        return `${src} ${preppedDirectives.join(' ')}`;
      })
      .join('; ');

    this.app
      .use(koaBody({ multipart: true }))
      .use(koaSession(this.sessionConfig, this.app))
      .use(new KoaCSRF())
      .use(koaStatic('assets/private'))
      .use(async (ctx, next) => {
        const start = Date.now();

        if (this.appPaths.has(ctx.path)) {
          ctx.session.views = ctx.session.views + 1 || 1;
          log('Views:', ctx.session.views);
        }

        ctx.set({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'deny',
          'X-XSS-Protection': '1; mode=block',
          'Content-Security-Policy': cspRules
        });

        await next();

        const xResponseTime = Date.now() - start;

        ctx.set('X-Response-Time', `${xResponseTime}ms`);

        log(`${ctx.method} ${ctx.url} (${ctx.status}) - ${xResponseTime}ms`);
      })
      .use(adminRouter.middleware.routes())
      .use(adminRouter.middleware.allowedMethods());

    log(this.appPaths);
    log(adminRouter.allPaths);
  }

  public async setup(): Promise<void> {
    await this.setup_middlewares();
  }
}
