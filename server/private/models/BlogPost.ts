import Model from './Model';
import { generate_random_int } from '../../util/primitives';

type BlogPostParameters = {
  title: string;
  author: string;
  timestamp: Date;
  htmlContent: string;
  quillData?: object;
  uniqueId?: string;
};

export default class BlogPost extends Model {
  protected props: BlogPostParameters = {};

  constructor(props: BlogPostParameters) {
    super('blog_posts', props);
  }

  private get props(): object {
    return {
      title: this.props.title,
      author: this.props.author,
      timestamp: this.props.timestamp,
      html: this.props.htmlContent,
      quillData: { ...this.props.quillData }
    };
  }

  public get info(): object {
    return { ...this.props };
  }

  public get id(): string {
    return this.props.uniqueId;
  }

  public set id(value: string) {
    this.props.uniqueId = value;
  }

  public get postTitle(): string {
    return this.props.title;
  }

  public get author(): string {
    return this.props.author;
  }

  public get datePublished(): Date {
    return this.props.timestamp;
  }

  public get html(): string {
    return this.props.htmlContent;
  }

  public async save(): Promise<BlogPost> {
    const [error, results] = await super.insert(this.props, ['insertedId']);

    if (error) throw error;

    this.id = results.insertedId;

    return this;
  }
}
