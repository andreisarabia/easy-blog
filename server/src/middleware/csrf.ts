import Koa from 'koa';
import csrf, { Options } from 'csrf';

type CSRFUserOptions = {
  invalidTokenMessage?: Function | string;
  invalidTokenStatusCode?: number;
  excludedMethods?: string[];
  disableQuery?: boolean;
};

const defaultCSRFOptions = {
  invalidTokenMessage: 'Invalid CSRF token',
  invalidTokenStatusCode: 403,
  excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
  disableQuery: false
};

const csrf_middleware = (options: CSRFUserOptions = {}) => {
  options = { ...defaultCSRFOptions, ...options };

  const Token = new csrf(options as Options);

  const add_csrf_to_context = (ctx: Koa.ParameterizedContext): void => {
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
  };

  return async (ctx: Koa.ParameterizedContext, next: () => Promise<any>) => {
    add_csrf_to_context(ctx);

    if (options.excludedMethods.includes(ctx.method)) return next();

    if (!ctx.session.secret) ctx.session.secret = await Token.secret();

    let token: string =
      ctx.request.body && typeof ctx.request.body._csrf === 'string'
        ? ctx.request.body._csrf
        : null;

    if (!token) {
      if (!options.disableQuery && ctx.query && ctx.query._csrf) {
        token = ctx.query._csrf;
      } else {
        token = ctx.get('csrf-token') || ctx.get('x-csrf-token');
      }
    }

    if (!token || !Token.verify(ctx.session.secret, token)) {
      return ctx.throw(
        options.invalidTokenStatusCode,
        typeof options.invalidTokenMessage === 'function'
          ? options.invalidTokenMessage(ctx)
          : options.invalidTokenMessage
      );
    }

    return next();
  };
};

export default csrf_middleware;
