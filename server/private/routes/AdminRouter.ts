import Koa from 'koa';
import Router from '../../src/Router';
import AdminAPIRouter from './api/AdminAPIRouter';
import BlogPost from '../models/BlogPost';
import AdminUser, { AdminUserParameters } from '../models/AdminUser';

const log = console.log;
const BASE_TITLE = '- Easy Blog Admin';
const ONE_DAY_IN_MS = 86400000;
const TEN_MIN_IN_MS = 600000;

type AdminBlogPostQueryParameters = {
  action: 'new' | 'edit';
  pageNum: number;
  blogId: string;
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
        if (!this.is_logged_in(ctx)) return ctx.redirect('login');

        await next();
      })
      .get('home', ctx => this.send_home_page(ctx))
      .get('posts', ctx => this.send_posts_page(ctx))
      .post('reset-templates', ctx => this.refresh_templates(ctx))
      .use(AdminAPIRouter.middleware.routes())
      .use(AdminAPIRouter.middleware.allowedMethods());

    this.blogCache = AdminAPIRouter.blogCache;

    log('Admin paths:', this.allPaths);
  }

  private is_logged_in(ctx: Koa.ParameterizedContext): boolean {
    return Boolean(ctx.cookies.get(this.sessionCookieName));
  }

  private async send_login_page(ctx: Koa.ParameterizedContext): Promise<void> {
    if (this.is_logged_in(ctx)) return ctx.redirect('home'); // reached login/register page, logged in

    ctx.body = await super.render('login.ejs', { csrf: ctx.csrf });
  }

  private async logout_user(ctx: Koa.ParameterizedContext): Promise<void> {
    const cookie = ctx.cookies.get(this.sessionCookieName);

    ctx.cookies.set(this.sessionCookieName, cookie, { maxAge: 0 });
    ctx.session = null;
    ctx.method = 'GET';
    ctx.redirect('login');
  }

  private async login_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (this.is_logged_in(ctx)) return ctx.redirect('back', 'home');

    const { username, password } = ctx.request.body as AdminUserParameters;
    const [err, user] = await AdminUser.attempt_login(username, password);

    if (err instanceof Error) {
      ctx.status = 403;
      ctx.body = await super.render('login.ejs', {
        csrf: ctx.csrf,
        errors: [err.message]
      });
    } else {
      ctx.cookies.set(
        this.sessionCookieName,
        user.cookieId,
        this.sessionConfig
      );

      await this.send_home_page(ctx);
    }
  }

  private async register_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (this.is_logged_in(ctx)) return ctx.redirect('back', 'home');

    const { username, email, password } = ctx.request
      .body as AdminUserParameters;

    const [err, newUser] = await AdminUser.register({
      username,
      email,
      password,
      cookieName: this.sessionCookieName
    });

    if (err instanceof Error) {
      ctx.status = 403;
      await super.render('login.ejs', { ctx: ctx.csrf, errors: [err.message] });
    } else {
      ctx.cookies.set(
        this.sessionCookieName,
        newUser.cookieId,
        this.sessionConfig
      );

      await this.send_home_page(ctx);
    }
  }

  private async send_home_page(ctx: Koa.ParameterizedContext): Promise<void> {
    ctx.body = await super.render('home.ejs', {
      msg: 'Welcome',
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
        const { blogId } = ctx.query as AdminBlogPostQueryParameters;
        const blogPostToEdit = await BlogPost.find(blogId);

        data.editor = true;
        data.title = `Edit Post ${BASE_TITLE}`;
        break;
      case undefined:
        const { pageNum = null } = ctx.query as AdminBlogPostQueryParameters;

        if (!pageNum) {
        }

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
