import Koa from 'koa';

import { promises as fs } from 'fs';
import bcrypt from 'bcrypt';
import Router from './Router';
import AdminAPIRouter from './api/AdminAPIRouter';
import { random_id } from '../../util/fns';

const log = console.log;
const BASE_TITLE = ' - Admin';
const TEN_SECONDS_IN_MS = 10000;
const SALT_ROUNDS = 10;

const is_valid_password = (pass: string) =>
  pass.length >= 2 && pass.length <= 55;

type AdminLoginParameters = {
  loginUsername: string;
  loginPassword: string;
};

type AdminRegisterParameters = {
  registerUsername: string;
  registerPassword: string;
};

export default class AdminRouter extends Router {
  private readonly sessionCookieName = 'easy-blog-admin:sess';

  constructor() {
    super({ routerPrefix: '/admin', templatePath: 'private' });

    const apiRouter = new AdminAPIRouter();

    this.instance
      .get('login', ctx =>
        ctx.cookies.get(this.sessionCookieName)
          ? ctx.redirect('home')
          : this.send_login_page(ctx)
      ) // reached login/register page, not logged in
      .post('login', ctx => this.login_user(ctx))
      .post('register', ctx =>
        ctx.cookies.get(this.sessionCookieName)
          ? ctx.redirect('home')
          : this.register_user(ctx)
      ) // reached login/register page, not logged in
      .use((ctx, next) =>
        ctx.cookies.get(this.sessionCookieName) ? next() : ctx.redirect('login')
      ) // reached past protected endpoint w/o valid cookie
      .get('home', ctx => this.send_home_page(ctx))
      .get('posts', ctx => this.send_posts_page(ctx))
      .post('reset-templates', ctx => this.refresh_templates(ctx))
      .use(apiRouter.middleware.routes())
      .use(apiRouter.middleware.allowedMethods());
  }

  private async send_login_page(ctx: Koa.ParameterizedContext) {
    ctx.body = await super.render('login.ejs', { csrf: ctx.csrf });
  }

  private async login_user(ctx: Koa.ParameterizedContext) {
    const { loginUsername, loginPassword } = ctx.request
      .body as AdminLoginParameters;
    const { username, password } = JSON.parse(
      await fs.readFile('users.json', { encoding: 'utf-8' })
    );
    const isUser = loginUsername === username;
    const isMatchingPassword = await bcrypt.compare(loginPassword, password);

    if (!isUser || !isMatchingPassword) {
      ctx.method = 'GET';
      ctx.session = null;
      ctx.redirect('login');
    }

    ctx.cookies.set(this.sessionCookieName, random_id(), {
      httpOnly: true,
      signed: true,
      maxAge: TEN_SECONDS_IN_MS
    });

    ctx.redirect('home');
  }

  private async register_user(ctx: Koa.ParameterizedContext) {
    const { registerUsername, registerPassword } = ctx.request
      .body as AdminRegisterParameters;

    ctx.assert(
      is_valid_password(registerPassword),
      401,
      'Password must be between 2 and 55 characters'
    );

    const hash = await bcrypt.hash(registerPassword, SALT_ROUNDS);

    ctx.cookies.set(this.sessionCookieName, random_id(), {
      httpOnly: true,
      signed: true,
      maxAge: TEN_SECONDS_IN_MS
    });

    log(registerUsername, registerPassword);

    await fs.writeFile(
      'users.json',
      JSON.stringify({ username: registerUsername, password: hash })
    );

    ctx.redirect('home');
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
