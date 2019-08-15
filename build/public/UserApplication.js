"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_static_1 = __importDefault(require("koa-static"));
const fns_1 = require("../util/fns");
const PUBLIC_ASSETS_PATH = 'templates/public/assets';
const log = console.log;
class UserApplication {
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
        const cspDirectives = Object.entries(this.contentSecurityPolicy).reduce((cspString, [src, directives]) => {
            const preppedDirectives = directives
                .map(directive => fns_1.is_url(directive) || directive.startsWith('.*')
                ? directive
                : `'${directive}'`)
                .join(' ');
            const directiveRule = `${src} ${preppedDirectives}`;
            return cspString ? `${cspString}; ${directiveRule}` : `${directiveRule}`;
        }, '');
        this.app.keys = ['easy-blog-visitor'];
        this.app
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
            .use(koa_static_1.default(PUBLIC_ASSETS_PATH, { defer: true }));
    }
}
exports.default = new UserApplication();
