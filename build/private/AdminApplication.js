"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_static_1 = __importDefault(require("koa-static"));
const AdminRouter_1 = __importDefault(require("./routes/AdminRouter"));
const csrf_1 = __importDefault(require("../src/middleware/csrf"));
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
    get cspString() {
        return Object.entries(this.contentSecurityPolicy).reduce((cspString, [src, directives]) => {
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
    }
    setup_middlewares() {
        const cspDirectives = this.cspString;
        this.app.keys = ['easy-blog-admin'];
        this.app
            .use(csrf_1.default())
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
            if (ctx.session) {
                ctx.session.views = ctx.session.views + 1 || 1;
                log('Views:', ctx.session.views);
            }
            log(`${ctx.method} ${ctx.url} (${ctx.status}) - ${xResponseTime}ms`);
        })
            .use(AdminRouter_1.default.middleware.routes())
            .use(AdminRouter_1.default.middleware.allowedMethods())
            .use(koa_static_1.default(ADMIN_ASSETS_PATH, { defer: true }));
    }
}
exports.default = new AdminApplication();
