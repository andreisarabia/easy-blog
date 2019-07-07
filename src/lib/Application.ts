require('dotenv').config();

import Koa from 'koa';
import koaBody from 'koa-body';
import koaSession from 'koa-session';
import routers from './routes/index';
import { is_url, random_id } from '../util/fns';

const contentSecurityPolicy = {
  'default-src': ['self'],
  'script-src': ['self', 'unsafe-inline'],
  'style-src': ['self', 'unsafe-inline']
};

const log = console.log;

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

export default class Application {
  private app: Koa = new Koa();
  private port: number = +process.env.PORT || 3000;

  constructor() {
    this.app.keys = ['secret'];
  }

  private async bootstrap(): Promise<void> {
    const cspDirectives = get_csp_header();
    const sessionConfig = {
      key: 'easy-blog-visitor:sess',
      maxAge: 86400000,
      httpOnly: true,
      overwrite: true,
      signed: true
    };

    this.app.use(koaSession(sessionConfig, this.app));
    this.app.use(koaBody({ multipart: true }));

    this.app.use(
      async (ctx: Koa.ParameterizedContext, next: () => Promise<void>) => {
        const start = Date.now();

        let n = ctx.session.views || 0;
        ctx.session.views = ++n;

        log(ctx.session.isNew);
        log(ctx.session.views);

        ctx.set({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'deny',
          'X-XSS-Protection': '1; mode=block',
          'Content-Security-Policy': cspDirectives()
        });

        await next();

        const xResponseTime = Date.now() - start;

        ctx.set('X-Response-Time', `${xResponseTime}ms`);
        log(`${ctx.method} ${ctx.url} (${ctx.status}) - ${xResponseTime}ms`);
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
