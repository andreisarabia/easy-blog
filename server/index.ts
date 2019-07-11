require('dotenv').config();

import Koa from 'koa';
import koaMount from 'koa-mount';
import AdminApplication from './private/AdminApplication';

const main = async (): Promise<void> => {
  const app = new Koa();
  const adminApp = new AdminApplication();

  await adminApp.setup();

  app.use(koaMount('/admin', adminApp.middleware));

  app.listen(+process.env.PORT || 3000, () => console.log('Listening...'));
};

main().catch(console.error);
