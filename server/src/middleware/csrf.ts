import Koa from 'koa';
import csrf from 'csrf';

type CSRFOptions = {
  invalidTokenMessage?: Function | string;
  invalidTokenStatusCode?: number;
  excludedMethods?: string[];
  disableQuery?: boolean;
};

const defaultCSRFOptions = {
  invalidTokenMessage: 'Invalid CSRF token',
  invalidTokenStatusCode: 403,
  excludedMethods: ['GET', 'HEAD'],
  disableQuery: false
};
const Token = new csrf();

const csrf_middleware = (options: CSRFOptions = {}) => {
  const add_csrf_to_context = (ctx: Koa.ParameterizedContext): void => {
    if (!ctx.csrf) {
      Object.defineProperty(ctx, 'csrf', {
        get() {
          if (ctx._csrf) return ctx._csrf;
          if (!ctx.session) return null;
          if (!ctx.session.secret) ctx.session.secret = Token.secretSync();
          ctx._csrf = Token.create(ctx.session.secret);
          return ctx._csrf;
        }
      });
      Object.defineProperty(ctx.response, 'csrf', {
        get() {
          return ctx.csrf;
        }
      });
    }
  };

  options = { ...defaultCSRFOptions, ...options };

  return async (ctx: Koa.ParameterizedContext, next: () => Promise<any>) => {
    if (options.excludedMethods.includes(ctx.method)) return await next();

    add_csrf_to_context(ctx);

    if (!ctx.session.secret) ctx.session.secret = await Token.secret();

    const bodyToken =
      ctx.request.body && typeof ctx.request.body._csrf === 'string'
        ? ctx.request.body._csrf
        : null;

    let token: string = null;

    if (bodyToken) {
      token = bodyToken;
    } else if (!options.disableQuery && ctx.query && ctx.query._csrf) {
      token = ctx.query._csrf;
    } else {
      token = ctx.get('csrf-token');
    }

    if (!token || !Token.verify(ctx.session.secret, token)) {
      return ctx.throw(
        options.invalidTokenStatusCode,
        typeof options.invalidTokenMessage === 'function'
          ? options.invalidTokenMessage(ctx)
          : options.invalidTokenMessage
      );
    }

    return await next();
  };
};

export default csrf_middleware;
