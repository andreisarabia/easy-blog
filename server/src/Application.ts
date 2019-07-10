import Koa from 'koa';
import koaMount from 'koa-mount';
import AdminApplication from '../private/AdminApplication';

const log = console.log;

export default class Application {
  private port: number = +process.env.PORT || 3000;
  private startTime: number = Date.now();
  protected appPaths: Set<string>;
  protected app: Koa = new Koa();

  constructor() {
    this.app.keys = ['easy-blog-app'];
  }

  protected get middleware() {
    return this.app;
  }

  protected async setup_middlewares(): Promise<void> {
    const adminApp = new AdminApplication();

    this.app.use(koaMount('/admin', adminApp.middleware));
  }

  public async start(): Promise<void> {
    await this.setup_middlewares();

    this.app.listen(this.port, () => {
      log(
        `Listening on port ${this.port}.\nStartup time: ${Date.now() -
          this.startTime}ms`
      );
    });
  }
}
