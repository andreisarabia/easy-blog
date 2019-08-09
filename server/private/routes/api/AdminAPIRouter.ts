import Koa from 'koa';
import Router from '../../../src/Router';
import AdminUser from '../../models/AdminUser';
import BlogPost from '../../models/BlogPost';
import BlogPostController from '../../controllers/BlogPostController';

const log = console.log;

type BlogPostParameters = {
  title: string;
  authorName: string;
  htmlContent: string;
  rawQuillData: object;
};

type AdminBlogPostQueryParameters = {
  action: '';
};

export default class AdminAPIRouter extends Router {
  public blogCache: Map<string, BlogPost> = new Map();

  constructor() {
    super({ prefix: 'api/' });

    BlogPostController.find_all().then(posts =>
      posts.forEach(post => this.blogCache.set(post.id, post))
    );

    this.instance
      .put('posts', ctx => this.create_post(ctx))
      .get('posts/:id', ctx => this.send_blog_data(ctx))
      .post('posts/:id', ctx => this.act_on_post(ctx))
      .post('user/update', ctx => this.update_user_permissions(ctx));
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

    if (this.blogCache.has(blogPost.previousId)) {
      this.blogCache.delete(blogPost.previousId);
    }

    this.blogCache.set(blogPost.id, blogPost);

    log(blogPost);

    ctx.body = { id: blogPost.id, htmlContent };
  }

  private async send_blog_data(ctx: Koa.ParameterizedContext): Promise<void> {
    const { id } = ctx.params;
    const blogPost: BlogPost = this.blogCache.get(id);

    log(blogPost);

    ctx.body = { content: blogPost.info };
  }

  private async act_on_post(ctx: Koa.ParameterizedContext): Promise<void> {
    const { action } = ctx.request.body as AdminBlogPostQueryParameters;
  }

  private async update_user_permissions(
    ctx: Koa.ParameterizedContext
  ): Promise<void> {
    
  }
}
