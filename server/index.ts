require('dotenv').config();

import Koa from 'koa';
import koaMount from 'koa-mount';
import koaSession from 'koa-session';
import AdminApplication from './private/AdminApplication';

const main = async () => {
  const adminApp = new AdminApplication();
  const app = new Koa();
  const appPort: number = +process.env.PORT || 3000;

  app.keys = ['easy-blog-visitor'];

  app
    .use(koaSession({ key: 'eb-visitor', maxAge: 10000 }, app))
    .use(koaMount('/admin', adminApp.middleware))
    .listen(appPort, () => console.log('Listening...'));
};

main().catch(console.error);
