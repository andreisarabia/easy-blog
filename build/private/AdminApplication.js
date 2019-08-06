"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_body_1 = __importDefault(require("koa-body"));
const koa_csrf_1 = __importDefault(require("koa-csrf"));
const koa_static_1 = __importDefault(require("koa-static"));
const AdminRouter_1 = __importDefault(require("./routes/AdminRouter"));
const fns_1 = require("../util/fns");
const ADMIN_ASSETS_PATH = 'templates/private/assets';
const log = console.log;
class AdminApplication {
    constructor() {
        this.app = new koa_1.default();
        this.contentSecurityPolicy = {
            'default-src': ['self'],
            'script-src': ['self', 'unsafe-inline'],
            'style-src': ['self', 'unsafe-inline'],
            'connect-src': ['self']
        };
        this.setup_middlewares();
    }
    get middleware() {
        return this.app;
    }
    setup_middlewares() {
        const adminRouter = new AdminRouter_1.default();
        const cspDirectives = Object.entries(this.contentSecurityPolicy).reduce((cspString, [src, directives]) => {
            const preppedDirectives = directives
                .map(directive => fns_1.is_url(directive) || directive.startsWith('.*')
                ? directive
                : `'${directive}'`)
                .join(' ');
            const directiveRule = `${src} ${preppedDirectives}`;
            return cspString
                ? `${cspString}; ${directiveRule}`
                : `${directiveRule}`;
        }, '');
        this.app.keys = ['easy-blog-admin'];
        this.app
            .use(koa_body_1.default({ json: true, multipart: true }))
            .use(new koa_csrf_1.default())
            .use(async (ctx, next) => {
            const start = Date.now();
            ctx.set({
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'deny',
                'X-XSS-Protection': '1; mode=block',
                'Content-Security-Policy': cspDirectives
            });
            await next();
            const xResponseTime = Date.now() - start;
            ctx.set('X-Response-Time', `${xResponseTime}ms`);
            ctx.session.views = ctx.session.views + 1 || 1;
            log(`${ctx.method} ${ctx.url} (${ctx.status}) - ${xResponseTime}ms`);
            log('Views:', ctx.session.views);
        })
            .use(adminRouter.middleware.routes())
            .use(adminRouter.middleware.allowedMethods())
            .use(koa_static_1.default(ADMIN_ASSETS_PATH, { defer: true }));
    }
}
exports.default = AdminApplication;
