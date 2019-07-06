require('dotenv').config();

import Koa from 'koa';
import routers from './routes/index';

const log = console.log;

export default class Application {
  private app: Koa = new Koa();
  private port: number = +process.env.PORT || 3000;

  private async bootstrap(): Promise<void> {
    this.app.use(async (ctx: Koa.Context, next: () => Promise<void>) => {
      try {
        const start = Date.now();
        await next();
        const xResponseTime = Date.now() - start;
        ctx.set('X-Response-Time', `${xResponseTime}ms`);
        console.log(`${ctx.method} ${ctx.url} - ${xResponseTime}ms`);
      } catch (error) {
        ctx.throw(error);
      }
    });
    await this.mount_routes();
  }

  private async mount_routes(): Promise<void> {
    routers.forEach(router => {
      this.app
        .use(router.middleware.routes())
        .use(router.middleware.allowedMethods());
      log(router.allPaths);
    });
  }

  public async start(): Promise<void> {
    await this.bootstrap();

    this.app.listen(this.port, () => log('Listening on port', this.port));
  }
}
