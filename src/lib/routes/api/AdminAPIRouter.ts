import Koa from 'koa';
import Router from './../Router';
import BlogPost from '../../models/BlogPost';

type BlogPostParameters = {
  id: string;
  author: string;
  timestamp: Date;
  content: string;
}; 

export default class AdminAPIRouter extends Router {
  constructor() {
    super({ routerPrefix: 'api' });

    this.instance
      .put('posts', ctx => this.create_post(ctx))
      .post('posts', ctx => this.edit_post(ctx));
  }

  private async create_post(ctx: Koa.ParameterizedContext): Promise<void> {
    const { id, author, timestamp, content } = ctx.request
      .body as BlogPostParameters;
    const blogPost = new BlogPost({ id, author, timestamp, content });
  }

  private async edit_post(ctx: Koa.ParameterizedContext): Promise<void> {
    const { id, author, timestamp, content } = ctx.request
      .body as BlogPostParameters;
  }
}
