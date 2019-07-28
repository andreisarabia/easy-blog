import Koa from 'koa';
import { promises as fs } from 'fs';
import bcrypt from 'bcrypt';
import Router from '../../src/Router';
import AdminAPIRouter from './api/AdminAPIRouter';
import BlogPost from '../models/BlogPost';
import { random_id } from '../../util/fns';

const log = console.log;
const BASE_TITLE = ' - Admin';
const ONE_DAY_IN_MS = 86400;
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
type AdminBlogPostParameters = {
  action: AdminBlogPostActions;
};
type AdminBlogPostActionData = {
  headerTitle: string;
  posts: object[];
  editor: boolean;
};
type AdminBlogPostActions = 'new' | 'edit';

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
      .use(apiRouter.middleware.routes())
      .use(apiRouter.middleware.allowedMethods());

    this.blogCache = apiRouter.blogCache;

    log('Admin paths:', this.allPaths);
  }

  private async send_login_page(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) ctx.redirect('home'); // reached login/register page, logged in

    ctx.body = await super.render('login.ejs', { csrf: ctx.csrf });
  }

  private async login_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) ctx.redirect('home'); // reached login/register page, logged in

    const { loginUsername, loginPassword } = ctx.request
      .body as AdminLoginParameters;
    const { username, password } = JSON.parse(
      await fs.readFile('users.json', { encoding: 'utf-8' })
    );
    const isUser = loginUsername === username;
    const isMatchingPassword = await bcrypt.compare(loginPassword, password);

    if (isUser && isMatchingPassword) {
      ctx.cookies.set(this.sessionCookieName, random_id(), this.sessionConfig);
      ctx.redirect('home');
    } else {
      ctx.method = 'GET';
      ctx.redirect('login');
    }
  }

  private async register_user(ctx: Koa.ParameterizedContext): Promise<void> {
    if (ctx.cookies.get(this.sessionCookieName)) ctx.redirect('home'); // reached login/register page, logged in

    const { registerUsername, registerPassword } = ctx.request
      .body as AdminRegisterParameters;

    ctx.assert(
      is_valid_password(registerPassword),
      401,
      'Password must be between 2 and 55 characters' // for now...
    );

    const hash = await bcrypt.hash(registerPassword, SALT_ROUNDS);

    await fs.writeFile(
      'users.json',
      JSON.stringify({ username: registerUsername, password: hash })
    );

    ctx.cookies.set(this.sessionCookieName, random_id(), this.sessionConfig);

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
    const { action } = ctx.query as AdminBlogPostParameters;
    const data: AdminBlogPostActionData = {
      headerTitle: '',
      posts: null,
      editor: false
    };

    log(action);

    switch (action) {
      case 'new':
        data.headerTitle = 'New Post';
        data.editor = true;
        break;
      case 'edit':
        const blogId = +ctx.query.blogId;
        ctx.assert(Number.isSafeInteger(blogId));
        data.editor = true;
        break;
      case undefined:
        data.headerTitle = 'Posts';

        data.posts = [...this.blogCache.values()]
          .slice(0, 10)
          .map((blogPost, i) => ({
            id: i,
            title: blogPost.postTitle,
            name: blogPost.author,
            date: blogPost.datePublished,
            snippet: blogPost.content
          }));

        log(data.posts);
        log(this.blogCache);
        break;
      default:
        ctx.redirect('back');
    }

    ctx.body = await super.render('posts.ejs', { ...data, csrf: ctx.csrf });
  }
}
