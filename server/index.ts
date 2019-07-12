require('dotenv').config();

import Koa from 'koa';
import koaMount from 'koa-mount';
import koaSession from 'koa-session';
import AdminApplication from './private/AdminApplication';

const main = async (): Promise<void> => {
  const mountedPrefix = '/admin';
  const app = new Koa();
  const adminApp = new AdminApplication(mountedPrefix);

  app.keys = ['easy-blog-visitor'];

  app
    .use(koaSession({ key: 'eb-visitor', maxAge: 10000 }, app))
    .use(koaMount(mountedPrefix, adminApp.middleware))
    .listen(+process.env.PORT || 3000, () => console.log('Listening...'));
};

main().catch(console.error);
