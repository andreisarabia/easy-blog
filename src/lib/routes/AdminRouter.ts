import Koa from 'koa';
import koaBody from 'koa-body';
import uuid from 'uuid';
import Router from './Router';
import AdminAPIRouter from './api/AdminAPIRouter';

const BASE_TITLE = ' - Admin';
const TEN_MINUTES_IN_MS = 100000;

const random_id = () => `${Date.now().toString()}-${uuid()}`;
const cookie_middleware = (cookieName: string) => {
  return async (ctx: Koa.ParameterizedContext, next: () => Promise<void>) => {
    if (!ctx.cookies.get(cookieName)) {
      ctx.cookies.set(cookieName, random_id(), {
        httpOnly: true,
        signed: true,
        maxAge: TEN_MINUTES_IN_MS
      });
    }
    await next();
  };
};

export default class AdminRouter extends Router {
  constructor() {
    super('/admin', 'private');

    const apiRouter = new AdminAPIRouter();

    this.instance
      .get('login', ctx => this.send_login_page(ctx))
      .use(cookie_middleware('easy-blog-admin:sess'))
      .get('home', ctx => this.send_home_page(ctx))
      .get('posts', ctx => this.send_posts_page(ctx))
      .post('reset-template-cache', ctx => this.refresh_template_cache(ctx))
      .use(apiRouter.middleware.routes())
      .use(apiRouter.middleware.allowedMethods());
  }

  private async send_login_page(ctx: Koa.ParameterizedContext) {
    ctx.body = await super.render('login.ejs');
  }

  private async send_home_page(ctx: Koa.ParameterizedContext) {
    ctx.body = await super.render('home.ejs', {
      msg: 'd',
      title: `Home ${BASE_TITLE}`
    });
  }

  private async send_posts_page(ctx: Koa.ParameterizedContext) {
    const exampleData = {
      posts: [
        {
          id: 1,
          name: 'dre sar',
          snippet: '... here i was',
          date: new Date()
        },
        {
          id: 2,
          name: 'sar dreee',
          snippet: 'there i go...',
          date: new Date()
        }
      ]
    };
    ctx.body = await super.render('posts.ejs', exampleData);
  }

  private async refresh_template_cache(ctx: Koa.ParameterizedContext) {
    await this.setup_templates();
    ctx.body = { msg: 'ok' };
  }
}
