require('dotenv').config();

import Koa from 'koa';
import koaMount from 'koa-mount';
import koaSession from 'koa-session';
import koaBody from 'koa-body';
import KoaCSRF from 'koa-csrf';
import AdminApplication from './private/AdminApplication';
import UserApplication from './public/UserApplication';

const main = async () => {
  const app = new Koa();
  const appPort: number = +process.env.PORT || 3000;
  const sessionConfig = {
    key: '_easy_blog',
    maxAge: 100000,
    overwrite: true,
    signed: true,
    httpOnly: true
  };

  app.keys = ['easy-blog-visitor'];

  app
    .use(koaSession(sessionConfig, app))
    .use(koaBody({ json: true, multipart: true }))
    .use(new KoaCSRF())
    .use(koaMount('/', UserApplication.middleware))
    .use(koaMount('/admin', AdminApplication.middleware))
    .listen(appPort, () => console.log('Listening...'));
};

main().catch(console.error);
