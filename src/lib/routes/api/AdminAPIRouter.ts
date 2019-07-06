import Koa from 'koa';
import koaBody from 'koa-body';
import Router from './../Router';

type CreateBlogPostParameters = {
  id: string;
  authorId: string;
  title: string;
  content: string;
};

export default class AdminAPIRouter extends Router {
  constructor() {
    super('api');

    this.instance.post('create-blog', ctx => this.create_blog_post(ctx));
  }

  private async create_blog_post(ctx: Koa.ParameterizedContext) {
    const { id, authorId, title, content } = ctx.request
      .body as CreateBlogPostParameters;
  }
}
