import Koa from 'koa';
import Router from '../../src/Router';
import AdminAPIRouter from './api/AdminAPIRouter';
import BlogPost from '../models/BlogPost';
import AdminUser, { AdminUserParameters } from '../models/AdminUser';

const log = console.log;
const BASE_TITLE = '- Easy Blog Admin';
const ONE_DAY_IN_MS = 86400;

type AdminLoginParameters = {
  loginUsername: string;
  loginPassword: string;
};
type AdminBlogPostQueryParameters = {
  action: 'new' | 'edit';
};
type AdminBlogPostActionData = {
  title: string;
  posts: object[];
  editor: boolean;
};

class AdminRouter extends Router {
  private readonly sessionCookieName = '_easy_blog_admin';
  private readonly sessionConfig = {
    httpOnly: true,
    signed: true,
    maxAge: process.env.NODE_ENV !== 'production' ? undefined : ONE_DAY_IN_MS // koaSession will default to 'session'
  };
  private readonly blogCache: Map<string, BlogPost>;

  constructor() {
    super({ templatePath: 'private' });

    this.instance
      .get('login', ctx => this.send_login_page(ctx))
      .get('logout', ctx => this.logout_user(ctx))
      .post('login', ctx => this.login_user(ctx))
      .post('register', ctx => this.register_user(ctx))
      .use(async (ctx, next) => {
        if (ctx.cookies.get(this.sessionCookieName)) {
          ctx.set('Cache-Control', 'no-cache');
          await next();
        } else {
          ctx.redirect('login'); // tried to reach protected endpoints w/o valid cookie
        }
      })
      .get('home', ctx => this.send_home_page(ctx))
      .get('posts', ctx => this.send_posts_page(ctx))
      .post('reset-templates', ctx => this.refresh_templates(ctx))
      .use(AdminAPIRouter.middleware.routes())
      .use(AdminAPIRouter.middleware.allowedMethods());

    this.blogCache = AdminAPIRouter.blogCache;

    log('Admin paths:', this.allPaths);
  }

  private async send_login_page(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) ctx.redirect('home'); // reached login/register page, logged in
    ctx.body = await super.render('login.ejs', { csrf: ctx.csrf });
  }

  private async logout_user(ctx: Koa.ParameterizedContext): Promise<void> {
    const cookie = ctx.cookies.get(this.sessionCookieName);
    ctx.cookies.set(this.sessionCookieName, cookie, { maxAge: 0 });
    ctx.redirect('login');
  }

  private async login_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) ctx.redirect('back', 'home'); // reached login/register page, logged in

    const { loginUsername, loginPassword } = ctx.request
      .body as AdminLoginParameters;

    const [loginErr, user] = await AdminUser.attempt_login(
      loginUsername,
      loginPassword
    );

    if (loginErr instanceof Error) {
      ctx.status = 403;
      ctx.method = 'GET';
      ctx.body = await super.render('login.ejs', {
        csrf: ctx.csrf,
        errors: [loginErr.message]
      });
    } else {
      ctx.cookies.set(
        this.sessionCookieName,
        user.cookieId,
        this.sessionConfig
      );
      ctx.redirect('home');
    }
  }

  private async register_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) ctx.redirect('back', 'home'); // reached login/register page, logged in

    const { username, email, password } = ctx.request
      .body as AdminUserParameters;

    const [err, newUser] = await AdminUser.register({
      username,
      email,
      password,
      cookieName: this.sessionCookieName
    });

    if (err instanceof Error) ctx.throw(err.message, 401);

    ctx.cookies.set(
      this.sessionCookieName,
      newUser.cookieId,
      this.sessionConfig
    );
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
        const { blogId } = ctx.query;
        const blogPostToEdit = await BlogPost.find(blogId);

        data.editor = true;
        data.title = `Edit Post ${BASE_TITLE}`;
        break;
      case undefined:
        data.title = `Posts ${BASE_TITLE}`;

        data.posts = [...this.blogCache.values()]
          .slice(0, 10)
          .map(blogPost => ({
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

export default new AdminRouter();
