"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = __importDefault(require("../../src/Router"));
const AdminAPIRouter_1 = __importDefault(require("./api/AdminAPIRouter"));
const AdminUser_1 = __importDefault(require("../models/AdminUser"));
const log = console.log;
const BASE_TITLE = '- Admin';
const ONE_DAY_IN_MS = 86400;
class AdminRouter extends Router_1.default {
    constructor() {
        super({ templatePath: 'private' });
        this.sessionCookieName = 'easy-blog-admin:sess';
        this.sessionConfig = {
            httpOnly: true,
            signed: true,
            maxAge: process.env.NODE_ENV !== 'production' ? undefined : ONE_DAY_IN_MS
        };
        const apiRouter = new AdminAPIRouter_1.default();
        this.instance
            .get('login', ctx => this.send_login_page(ctx))
            .get('logout', ctx => this.logout_user(ctx))
            .post('login', ctx => this.login_user(ctx))
            .post('register', ctx => this.register_user(ctx))
            .use((ctx, next) => {
            if (ctx.cookies.get(this.sessionCookieName)) {
                next();
            }
            else {
                ctx.redirect('login');
            }
        })
            .get('home', ctx => this.send_home_page(ctx))
            .get('posts', ctx => this.send_posts_page(ctx))
            .post('reset-templates', ctx => this.refresh_templates(ctx))
            .use(apiRouter.middleware.routes())
            .use(apiRouter.middleware.allowedMethods());
        this.blogCache = apiRouter.blogCache;
        log('Admin paths:', this.allPaths);
    }
    async send_login_page(ctx) {
        if (ctx.cookies.get(this.sessionCookieName))
            ctx.redirect('home');
        ctx.body = await super.render('login.ejs', { csrf: ctx.csrf });
    }
    async logout_user(ctx) {
        const cookie = ctx.cookies.get(this.sessionCookieName);
        ctx.cookies.set(this.sessionCookieName, cookie, { maxAge: 0 });
        ctx.redirect('login');
    }
    async login_user(ctx) {
        if (ctx.cookies.get(this.sessionCookieName))
            ctx.redirect('back', 'home');
        const { loginUsername, loginPassword } = ctx.request
            .body;
        const [loginErr, user] = await AdminUser_1.default.attempt_login(loginUsername, loginPassword);
        if (loginErr instanceof Error) {
            ctx.status = 403;
            await this.send_login_page(ctx);
        }
        else {
            ctx.cookies.set(this.sessionCookieName, user.cookieId, this.sessionConfig);
            ctx.redirect('home');
        }
    }
    async register_user(ctx) {
        if (ctx.cookies.get(this.sessionCookieName))
            ctx.redirect('back', 'home');
        const { registerUsername, registerPassword, email } = ctx.request
            .body;
        const [err, newUser] = await AdminUser_1.default.register(registerUsername, registerPassword, email, this.sessionCookieName);
        if (err instanceof Error)
            ctx.throw(err.message, 401);
        ctx.cookies.set(this.sessionCookieName, newUser.cookieId, this.sessionConfig);
        ctx.redirect('home');
    }
    async send_home_page(ctx) {
        ctx.body = await super.render('home.ejs', {
            msg: 'd',
            title: `Home ${BASE_TITLE}`,
            csrf: ctx.csrf
        });
    }
    async send_posts_page(ctx) {
        const { action } = ctx.query;
        const data = {
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
    async refresh_templates(ctx) {
        await super.refresh_template_cache();
        ctx.body = { msg: 'ok' };
    }
}
exports.default = AdminRouter;
