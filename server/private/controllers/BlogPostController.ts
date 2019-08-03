import Controller from './Controller';
import BlogPost from '../models/BlogPost';
import Database from '../../src/Database';

const databaseCollection = 'blog_posts';

type BlogPostParameters = {
  title: string;
  author: string;
  timestamp: Date;
  htmlContent: string;
  quillData?: object;
  _id?: string;
};

class BlogPostController extends Controller {
  public async find_all(): Promise<BlogPost[]> {
    const documents = (await super.find({})) as BlogPostParameters[];

    return documents.map(doc => new BlogPost(doc));
  }
}

export default new BlogPostController('blog_posts');
