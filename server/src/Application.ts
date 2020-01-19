import Koa from 'koa';
import { is_url } from '../util/fns';

export type ContentSecurityPolicy = {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'connect-src': string[];
};

export default class Application {
  protected app: Koa;
  protected csp: ContentSecurityPolicy;

  protected constructor() {}

  public get middleware(): Koa {
    return this.app;
  }

  protected get cspHeader(): string {
    let header = '';

    for (const [src, directives] of Object.entries(this.csp)) {
      const preppedDirectives = directives.map(directive => {
        if (is_url(directive) || directive.startsWith('.*')) {
          directive = `'${directive}'`;
        }
        return directive;
      });
      const directiveRule = `${src} ${preppedDirectives.join(' ')}`;

      header += header === '' ? `${directiveRule}` : `; ${directiveRule}`;
    }

    return header;
  }

  protected setup_middlewares(): void {
    throw Error(
      'Application subclasses must implement a `setup_middlewares` function'
    );
  }
}
