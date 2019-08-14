import Koa from 'koa';
import koaStatic from 'koa-static';
import { is_url } from '../util/fns';

const PUBLIC_ASSETS_PATH = 'templates/public/assets';
const log = console.log;

class UserApplication {
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
    const cspDirectives: string = Object.entries(
      this.contentSecurityPolicy
    ).reduce((cspString, [src, directives]) => {
      const preppedDirectives = directives
        .map(directive =>
          is_url(directive) || directive.startsWith('.*')
            ? directive
            : `'${directive}'`
        )
        .join(' ');
      const directiveRule = `${src} ${preppedDirectives}`;

      return cspString ? `${cspString}; ${directiveRule}` : `${directiveRule}`;
    }, '');

    this.app.keys = ['easy-blog-visitor'];

    this.app
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
      .use(koaStatic(PUBLIC_ASSETS_PATH, { defer: true }));
  }
}

export default new UserApplication();
