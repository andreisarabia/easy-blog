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
  private previousId: string;

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

  public get penultimateId(): string {
    return this.previousId;
  }

  public async save(): Promise<BlogPost> {
    const [error, results] = await super.save({
      includeInResults: ['insertedId']
    });

    if (error) throw error;

    if (this.props.uniqueId) this.previousId = this.props.uniqueId;

    this.props.uniqueId = results.insertedId;

    return this;
  }
}
