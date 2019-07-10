import Koa from 'koa';
import { promises as fs } from 'fs';
import bcrypt from 'bcrypt';
import Router from './Router';
import AdminAPIRouter from './api/AdminAPIRouter';
import { random_id } from '../../util/fns';
import _fs from 'fs';
import koaStatic from 'koa-static';
import path from 'path';

const log = console.log;
const BASE_TITLE = ' - Admin';
const TEN_MINS_IN_MS = 100000; // ten mins for now to dev...
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
    super({
      routerPrefix: '/admin',
      templatePath: 'private',
      assetsPath: 'private'
    });

    const apiRouter = new AdminAPIRouter();

    this.instance
      .get('login', ctx => this.send_login_page(ctx))

      .post('login', ctx => this.login_user(ctx))
      .post('register', ctx => this.register_user(ctx))
      .use(async (ctx, next) => {
        if (ctx.cookies.get(this.sessionCookieName)) {
          await next();
        } else {
          ctx.method = 'GET';
          ctx.redirect('login'); // tried to reach protected endpoints w/o valid cookie
        }
      })

      .get('home', ctx => this.send_home_page(ctx))
      .get('posts', ctx => this.send_posts_page(ctx))
      .post('reset-templates', ctx => this.refresh_templates(ctx))
      .use(apiRouter.middleware.routes())
      .use(apiRouter.middleware.allowedMethods());
  }

  private async send_login_page(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) return ctx.redirect('home'); // reached login/register page, logged in

    ctx.body = await super.render('login.ejs', { csrf: ctx.csrf });
  }

  private async login_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) return ctx.redirect('home'); // reached login/register page, logged in

    const f = await fs
      .access('users.json', _fs.constants.F_OK)
      .catch(err => err);

    if (f instanceof Error) {
      ctx.method = 'GET';
      return ctx.redirect('login');
    }

    const { loginUsername, loginPassword } = ctx.request
      .body as AdminLoginParameters;
    const { username, password } = JSON.parse(
      await fs.readFile('users.json', { encoding: 'utf-8' })
    );
    const isUser = loginUsername === username;
    const isMatchingPassword = await bcrypt.compare(loginPassword, password);

    if (isUser && isMatchingPassword) {
      ctx.cookies.set(this.sessionCookieName, random_id(), {
        httpOnly: true,
        signed: true,
        maxAge: TEN_MINS_IN_MS
      });
      ctx.redirect('home');
    } else {
      ctx.method = 'GET';
      ctx.redirect('login');
    }
  }

  private async register_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) return ctx.redirect('home'); // reached login/register page, logged in

    const { registerUsername, registerPassword } = ctx.request
      .body as AdminRegisterParameters;

    ctx.assert(
      is_valid_password(registerPassword),
      401,
      'Password must be between 2 and 55 characters'
    );

    ctx.cookies.set(this.sessionCookieName, random_id(), {
      httpOnly: true,
      signed: true,
      maxAge: TEN_MINS_IN_MS
    });

    const hash = await bcrypt.hash(registerPassword, SALT_ROUNDS);

    await fs.writeFile(
      'users.json',
      JSON.stringify({ username: registerUsername, password: hash })
    );

    ctx.redirect('home');
  }

  private async send_home_page(ctx: Koa.ParameterizedContext): Promise<void> {
    ctx.body = await super.render('home.ejs', {
      msg: 'd',
      title: `Home ${BASE_TITLE}`
    });
  }

  private async send_posts_page(ctx: Koa.ParameterizedContext): Promise<void> {
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

  private async refresh_templates(
    ctx: Koa.ParameterizedContext
  ): Promise<void> {
    await this.setup_templates();
    ctx.body = { msg: 'ok' };
  }
}
