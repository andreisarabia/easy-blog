import Controller from './Controller';
import BlogPost from '../models/BlogPost';

export default class BlogPostController extends Controller {
  protected static databaseCollection: string = 'blog_posts';

  constructor() {
    super({ collection: 'blog_posts' });
  }
}
