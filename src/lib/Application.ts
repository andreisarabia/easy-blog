import Koa from 'koa';
import koaBody from 'koa-body';
import koaSession from 'koa-session';
import KoaCSRF from 'koa-csrf';
import routers from './routes/index';
import { is_url, random_id } from '../util/fns';

const TEN_MINUTES_IN_MS = 100000;
const log = console.log;

export default class Application {
  private app: Koa = new Koa();
  private port: number = +process.env.PORT || 3000;
  private readonly sessionConfig = {
    key: 'easy-blog-visitor:sess',
    maxAge: TEN_MINUTES_IN_MS,
    httpOnly: true,
    overwrite: true,
    signed: true
  };
  private readonly contentSecurityPolicy = {
    'default-src': ['self'],
    'script-src': ['self', 'unsafe-inline'],
    'style-src': ['self', 'unsafe-inline']
  };
  private startTime: number = Date.now();

  private async bootstrap(): Promise<void> {
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

    this.app.keys = ['easy-blog-app'];

    this.app
      .on('error', err => log(err))
      .use(koaBody({ multipart: true }))
      .use(koaSession(this.sessionConfig, this.app))
      .use(
        new KoaCSRF({
          invalidTokenMessage: 'Invalid request sent.',
          invalidTokenStatusCode: 403
        })
      )
      .use(async (ctx: Koa.ParameterizedContext, next: () => Promise<void>) => {
        const start = Date.now();

        ctx.session.views = ctx.session.views + 1 || 1;

        log('Views:', ctx.session.views);

        ctx.set({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'deny',
          'X-XSS-Protection': '1; mode=block',
          'Content-Security-Policy': cspRules
        });

        await next(); // will hand off request to rest of middlewares

        const xResponseTime = Date.now() - start;

        ctx.set('X-Response-Time', `${xResponseTime}ms`);
        log(`${ctx.method} ${ctx.url} (${ctx.status}) - ${xResponseTime}ms`);
      });

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

    this.app.listen(this.port, () => {
      log(
        `Listening on port ${this.port}.\nStartup time: ${Date.now() -
          this.startTime}ms`
      );
    });
  }
}
