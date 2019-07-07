import Koa from 'koa';
import koaBody from 'koa-body';
import uuid from 'uuid';
import Router from './Router';
import AdminAPIRouter from './api/AdminAPIRouter';

const BASE_TITLE = ' - Admin';
const TEN_SECONDS_IN_MS = 10000;

const random_id = () => `${Date.now().toString()}-${uuid()}`;

type LoginParameters = {
  username: string;
  password: string;
};

export default class AdminRouter extends Router {
  private readonly sessionCookieName = 'easy-blog-admin:sess';

  constructor() {
    super({ routerPrefix: '/admin', templatePath: 'private' });

    const apiRouter = new AdminAPIRouter();

    this.instance
      .use(koaBody({ multipart: true }))
      .get('login', async ctx =>
        ctx.cookies.get(this.sessionCookieName)
          ? ctx.redirect('home')
          : await this.send_login_page(ctx)
      )
      .post('login', async ctx => await this.login_user(ctx))
      .use(async (ctx, next) =>
        ctx.cookies.get(this.sessionCookieName)
          ? await next()
          : ctx.redirect('login')
      )
      .get('home', async ctx => await this.send_home_page(ctx))
      .get('posts', async ctx => await this.send_posts_page(ctx))
      .post('reset-templates', async ctx => await this.refresh_templates(ctx))
      .use(apiRouter.middleware.routes())
      .use(apiRouter.middleware.allowedMethods());
  }

  private async send_login_page(ctx: Koa.ParameterizedContext) {
    ctx.body = await super.render('login.ejs');
  }

  private async login_user(ctx: Koa.ParameterizedContext) {
    const { username, password } = ctx.request.body as LoginParameters;

    if (username && password) {
      // TODO: actual password comparison...
      ctx.cookies.set(this.sessionCookieName, random_id(), {
        httpOnly: true,
        signed: true,
        maxAge: TEN_SECONDS_IN_MS
      });
      ctx.redirect('home');
    } else {
      ctx.redirect('login');
    }
  }

  private async send_home_page(ctx: Koa.ParameterizedContext) {
    ctx.body = await super.render('home.ejs', {
      msg: 'd',
      title: `Home ${BASE_TITLE}`
    });
  }

  private async send_posts_list(ctx: Koa.ParameterizedContext) {
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

  private async refresh_templates(ctx: Koa.ParameterizedContext) {
    await this.setup_templates();
    ctx.body = { msg: 'ok' };
  }
}
