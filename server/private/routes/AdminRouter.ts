import Koa from 'koa';
import uuid from 'uuid/v4';
import Router from '../../src/Router';
import AdminAPIRouter from './api/AdminAPIRouter';
import BlogPost from '../models/BlogPost';
import AdminUser from '../models/AdminUser';

const log = console.log;
const BASE_TITLE = '- Admin';
const ONE_DAY_IN_MS = 86400;

type AdminLoginParameters = {
  loginUsername: string;
  loginPassword: string;
};
type AdminRegisterParameters = {
  registerUsername: string;
  registerPassword: string;
  email: string;
};
type AdminBlogPostQueryParameters = {
  action: 'new' | 'edit';
};
type AdminBlogPostActionData = {
  title: string;
  posts: object[];
  editor: boolean;
};

export default class AdminRouter extends Router {
  private readonly sessionCookieName = 'easy-blog-admin:sess';
  private readonly sessionConfig = {
    httpOnly: true,
    signed: true,
    maxAge: process.env.NODE_ENV !== 'production' ? undefined : ONE_DAY_IN_MS // koaSession will default to 'session'
  };
  private readonly blogCache: Map<string, BlogPost>;

  constructor() {
    super({ templatePath: 'private' });

    const apiRouter = new AdminAPIRouter();

    this.instance
      .get('login', ctx => this.send_login_page(ctx))
      .get('logout', ctx => this.logout_user(ctx))
      .post('login', ctx => this.login_user(ctx))
      .post('register', ctx => this.register_user(ctx))
      .use(
        (ctx, next) =>
          ctx.cookies.get(this.sessionCookieName)
            ? next()
            : this.send_login_page(ctx) // tried to reach protected endpoints w/o valid cookie
      )
      .get('home', ctx => this.send_home_page(ctx))
      .get('posts', ctx => this.send_posts_page(ctx))
      .post('reset-templates', ctx => this.refresh_templates(ctx))
      .use(apiRouter.middleware.routes())
      .use(apiRouter.middleware.allowedMethods());

    this.blogCache = apiRouter.blogCache;

    log('Admin paths:', this.allPaths);
  }

  private async send_login_page(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) ctx.redirect('home'); // reached login/register page, logged in

    ctx.body = await super.render('login.ejs', { csrf: ctx.csrf });
  }

  private async logout_user(ctx: Koa.ParameterizedContext): Promise<void> {
    ctx.session = null;
    ctx.redirect('login');
  }

  private async login_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) ctx.redirect('back', 'home'); // reached login/register page, logged in

    const { loginUsername, loginPassword } = ctx.request
      .body as AdminLoginParameters;

    const [successfulLogin] = await AdminUser.attempt_login(
      loginUsername,
      loginPassword
    );

    if (!successfulLogin) {
      ctx.status = 403;
      await this.send_login_page(ctx);
    } else {
      ctx.cookies.set(this.sessionCookieName, uuid(), this.sessionConfig);
      ctx.redirect('home');
    }
  }

  private async register_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) ctx.redirect('back', 'home'); // reached login/register page, logged in

    const { registerUsername, registerPassword, email } = ctx.request
      .body as AdminRegisterParameters;

    const [err] = await AdminUser.register(
      registerUsername,
      registerPassword,
      email
    );

    if (err instanceof Error) ctx.throw(err.message, 401);

    ctx.cookies.set(this.sessionCookieName, uuid(), this.sessionConfig);
    ctx.redirect('home');
  }

  private async send_home_page(ctx: Koa.ParameterizedContext): Promise<void> {
    ctx.body = await super.render('home.ejs', {
      msg: 'd',
      title: `Home ${BASE_TITLE}`,
      csrf: ctx.csrf
    });
  }

  private async send_posts_page(ctx: Koa.ParameterizedContext): Promise<void> {
    const { action } = ctx.query as AdminBlogPostQueryParameters;
    const data: AdminBlogPostActionData = {
      title: '',
      posts: null,
      editor: false
    };

    switch (action) {
      case 'new':
        data.title = `New Post ${BASE_TITLE}`;
        data.editor = true;
        break;
      case 'edit':
        const blogId = +ctx.query.blogId;
        ctx.assert(Number.isSafeInteger(blogId));
        data.editor = true;
        data.title = `Edit Post ${BASE_TITLE}`;
        break;
      case undefined:
        data.title = `Posts ${BASE_TITLE}`;

        // console.log(this.blogCache);

        data.posts = [...this.blogCache.values()]
          .slice(0, 10)
          .map((blogPost, i) => ({
            id: blogPost.id,
            title: blogPost.postTitle,
            name: blogPost.author,
            date: blogPost.datePublished,
            snippet: blogPost.html
          }));
        break;
      default:
        ctx.redirect('back');
    }

    ctx.body = await super.render('posts.ejs', {
      ...data,
      headerTitle: data.title,
      csrf: ctx.csrf
    });
  }

  private async refresh_templates(
    ctx: Koa.ParameterizedContext
  ): Promise<void> {
    await super.refresh_template_cache();
    ctx.body = { msg: 'ok' };
  }
}
