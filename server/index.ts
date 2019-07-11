require('dotenv').config();

import Koa from 'koa';
import koaMount from 'koa-mount';
import koaSession from 'koa-session';
import AdminApplication from './private/AdminApplication';

const main = async (): Promise<void> => {
  const adminApp = new AdminApplication();
  const app = new Koa();

  app.use(koaMount('/admin', await adminApp.setup(app)));

  // await adminApp.setup();

  app.listen(+process.env.PORT || 3000, () => console.log('Listening...'));
};

main().catch(console.error);
