import Controller from './Controller';
import BlogPost, { BlogPostParameters } from '../models/BlogPost';
import Database from '../../src/Database';

class BlogPostController extends Controller {
  constructor() {
    super('blog_posts');
  }

  public async find_all(): Promise<BlogPost[]> {
    const documents = (await super.find({})) as BlogPostParameters[];

    return documents.map(doc => new BlogPost(doc));
  }
}

export default new BlogPostController();
