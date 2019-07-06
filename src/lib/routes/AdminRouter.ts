import Koa from 'koa';
import koaBody from 'koa-body';
import Router from './Router';

type CreateBlogPostParameters = {
  id: string;
  authorId: string;
  title: string;
  content: string;
};

export default class AdminRouter extends Router {
  constructor() {
    super('/admin', 'private');
    this.setup();
    this.instance
      .get('/home', async ctx => await this.send_home_page(ctx))
      .get('/blog/edit', async ctx => await this.send_blog_editor_page(ctx))
      .post('/create_blog', async ctx => await this.create_blog_post(ctx));
  }

  private async send_home_page(ctx: Koa.Context) {
    ctx.body = await super.render('home.ejs');
  }

  private async send_blog_editor_page(ctx: Koa.Context) {
    ctx.body = await super.render('blog/create.ejs');
  }

  private async create_blog_post(ctx: Koa.Context) {
    const { id, authorId, title, content } = ctx.request
      .body as CreateBlogPostParameters;
  }
}
