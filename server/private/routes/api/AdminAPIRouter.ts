import Koa from 'koa';
import Router from '../../../src/Router';
import BlogPost from '../../models/BlogPost';

type BlogPostParameters = {
  title: string;
  authorName: string;
  htmlContent: string;
  rawQuillData: object;
};

export default class AdminAPIRouter extends Router {
  public blogCache: Map<string, BlogPost> = new Map();

  constructor() {
    super({ prefix: 'api/' });

    this.instance
      .put('posts', ctx => this.create_post(ctx))
      .get('posts/:id', ctx => this.send_blog_data(ctx))
      .post('posts/:id', ctx => this.act_on_post(ctx))
      .post('reset-templates', ctx => this.refresh_templates(ctx));
  }

  private async create_post(ctx: Koa.ParameterizedContext): Promise<void> {
    const { title, authorName, htmlContent, rawQuillData } = ctx.request
      .body as BlogPostParameters;
    const blogPost = await new BlogPost({
      title,
      author: authorName,
      htmlContent,
      quillData: rawQuillData,
      timestamp: new Date()
    }).save();

    if (this.blogCache.has(blogPost.penultimateId)) {
      this.blogCache.delete(blogPost.penultimateId);
    }

    this.blogCache.set(blogPost.id, blogPost);

    console.log(blogPost);

    ctx.body = { id: blogPost.id, htmlContent };
  }

  private async send_blog_data(ctx: Koa.ParameterizedContext): Promise<void> {
    const { id } = ctx.params;
    const blogPost = this.blogCache.get(id) || {};

    console.log(blogPost);

    ctx.body = { content: blogPost.info };
  }

  private async act_on_post(ctx: Koa.ParameterizedContext): Promise<void> {
    const { action } = ctx.request.body;
  }

  private async refresh_templates(
    ctx: Koa.ParameterizedContext
  ): Promise<void> {
    await super.refresh_template_cache();
    ctx.body = { msg: 'ok' };
  }
}
