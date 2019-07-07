import Koa from 'koa';
import Router from './../Router';

type CreateBlogPostParameters = {
  id: string;
  authorId: string;
  title: string;
  content: string;
};

export default class AdminAPIRouter extends Router {
  constructor() {
    super({ routerPrefix: 'api' });

    this.instance.post('create-blog', async ctx => await this.create_post(ctx));
  }

  private async create_post(ctx: Koa.ParameterizedContext) {
    const { id, authorId, title, content } = ctx.request
      .body as CreateBlogPostParameters;
  }
}
