require('dotenv').config();

import Koa from 'koa';
import koaMount from 'koa-mount';
import koaSession from 'koa-session';
// import AdminApplication from './private/AdminApplication';
import AdminRouter from './private/routes/AdminRouter';

const main = async (): Promise<void> => {
  const adminApp = new Koa();
  const app = new Koa();
  const adminRouter = new AdminRouter();

  adminApp
    .use(adminRouter.middleware.routes())
    .use(adminRouter.middleware.allowedMethods());

  app.use(koaMount('/admin', adminApp));

  app.listen(+process.env.PORT || 3000, () => console.log('Listening...'));
};

main().catch(console.error);
