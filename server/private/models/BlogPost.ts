import Model from './Model';
import { generate_random_int } from '../../util/primitives';

type BlogPostParameters = {
  title: string;
  author: string;
  timestamp: Date;
  htmlContent: string;
  quillData?: object;
};

export default class BlogPost extends Model {
  private title: string;
  private authorName: string;
  private timestamp: Date;
  private html: string;
  private quillData: object;
  private uniqueId: string;

  constructor(props: BlogPostParameters) {
    super('blog_posts');

    this.title = props.title;
    this.authorName = props.author;
    this.timestamp = props.timestamp;
    this.html = props.htmlContent;
    this.quillData = props.quillData;
  }

  private get props(): object {
    return {
      title: this.title,
      author: this.authorName,
      timestamp: this.timestamp,
      html: this.html,
      quillData: { ...this.quillData }
    };
  }

  public get info(): object {
    return { ...this.props };
  }

  public get id(): string {
    return this.uniqueId;
  }

  public set id(value: string) {
    this.uniqueId = value;
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

  public get htmlContent(): string {
    return this.html;
  }

  public get rawData(): object {
    return { ...this.quillData };
  }

  public async save(): Promise<BlogPost> {
    const [error, results] = await super.insert(this.props, ['insertedId']);

    if (error) throw error;

    this.id = results.insertedId;

    return this;
  }
}
