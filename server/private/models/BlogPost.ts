import Model from './Model';
import { generate_random_int } from '../../util/primitives';

type BlogPostParameters = {
  id?: number;
  authorName: string;
  timestamp: Date;
  htmlContent: string;
  rawData?: object;
};

export default class BlogPost extends Model {
  private id: number;
  private authorName: string;
  private timestamp: Date;
  private htmlContent: string;
  private rawData: object;

  constructor(props: BlogPostParameters) {
    super();

    this.id = props.id || generate_random_int(0, 1500000);
    this.authorName = props.authorName;
    this.timestamp = props.timestamp;
    this.htmlContent = props.htmlContent;
    this.rawData = props.rawData;
  }

  public get uniqueId(): number {
    return this.id;
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
