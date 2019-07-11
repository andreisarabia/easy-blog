import Koa from 'koa';

const log = console.log;

export default class Application {
  protected startTime: number = Date.now();
  protected appPaths: Set<string>;
  protected app: Koa = new Koa();

  public get middleware() {
    return this.app;
  }
}
