import Model from './Model';
import { generate_random_int } from '../../util/primitives';

type BlogPostParameters = {
  title: string;
  authorName: string;
  timestamp: Date;
  htmlContent: string;
  rawData?: object;
};

export default class BlogPost extends Model {
  private title: string;
  private authorName: string;
  private timestamp: Date;
  private htmlContent: string;
  private rawData: object;

  constructor(props: BlogPostParameters) {
    super('blog_posts');

    this.title = props.title;
    this.authorName = props.authorName;
    this.timestamp = props.timestamp;
    this.htmlContent = props.htmlContent;
    this.rawData = props.rawData;
  }

  public get postTitle(): string {
    return this.title;
  }

  public get author(): string {
    return this.authorName;
  }

  public get datePublished(): Date {
    return this.timestamp;
  }

  public get content(): string {
    return this.htmlContent;
  }

  public get data(): object {
    return this.rawData;
  }
}
