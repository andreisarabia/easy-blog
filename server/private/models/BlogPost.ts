import Model from './Model';

const COLLECTION_NAME = 'blog_posts';

type BlogPostParameters = {
  title: string;
  author: string;
  timestamp: Date;
  htmlContent: string;
  quillData?: object;
  _id?: string;
};

export default class BlogPost extends Model {
  protected props: BlogPostParameters;
  private penultimateId: string;

  constructor(props: BlogPostParameters) {
    super(BlogPost.collectionName, props);
  }

  public get info(): object {
    return { ...this.props };
  }

  public get id(): string {
    return this.props._id;
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

  public get previousId(): string {
    return this.penultimateId;
  }

  private static get collectionName(): string {
    return COLLECTION_NAME;
  }

  public async save(): Promise<BlogPost> {
    const [error, results] = await super.save({
      includeInResults: ['insertedId']
    });

    if (error) throw error;

    if (this.props._id) this.penultimateId = this.props._id;

    this.props._id = results.insertedId;

    return this;
  }

  public static async find(id: string): Promise<BlogPost> {
    const blogPostData = (await Model.search({
      collection: BlogPost.collectionName,
      criteria: { id },
      limit: 1
    })) as BlogPostParameters;

    return blogPostData ? new BlogPost(blogPostData) : null;
  }
}
