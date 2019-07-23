import Koa from 'koa';
import Router from '../../../src/Router';
import BlogPost from '../../models/BlogPost';

type BlogPostParameters = {
  id: string;
  authorName: string;
  htmlContent: string;
  rawQuillData: object;
};

export default class AdminAPIRouter extends Router {
  public blogCache: Map<number, BlogPost> = new Map();

  constructor() {
    super({ prefix: 'api/' });

    this.instance
      .put('posts', ctx => this.create_post(ctx))
      .get('posts/:id', ctx => this.send_blog_data(ctx))
      .post('posts/:id', ctx => this.act_on_post(ctx));
  }

  private async create_post(ctx: Koa.ParameterizedContext): Promise<void> {
    const { authorName, htmlContent, rawQuillData } = ctx.request
      .body as BlogPostParameters;
    const blogPost = new BlogPost({
      authorName,
      htmlContent,
      timestamp: new Date()
    });

    this.blogCache.set(blogPost.uniqueId, blogPost);

    ctx.body = { id: blogPost.uniqueId, htmlContent };
  }

  private async send_blog_data(ctx: Koa.ParameterizedContext): Promise<void> {
    const { id } = ctx.params;
    const blogPost = this.blogCache.get(+id);

    console.log(blogPost);

    ctx.body = { content: blogPost.data };
  }

  private async act_on_post(ctx: Koa.ParameterizedContext): Promise<void> {
    const { action } = ctx.request.body;
  }
}
