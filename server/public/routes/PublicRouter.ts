import Koa from 'koa';
import Router from '../../src/Router';

const log = console.log;
const BASE_TITLE = '- Easy Blog';

class PublicRouter extends Router {
  private cache = new Map();

  constructor() {
    super({ templatePath: 'public' });

     
  }
}

export default new PublicRouter();
