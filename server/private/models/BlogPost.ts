import Model from './Model';
import { generate_random_int } from '../../util/primitives';

type BlogPostParameters = {
  id?: number;
  authorName: string;
  timestamp: Date;
  content: string;
};

export default class BlogPost extends Model {
  private id: number;
  private authorName: string;
  private timestamp: Date;
  private content: string;

  constructor(props: BlogPostParameters) {
    super();

    this.id = props.id || generate_random_int(0, 1500000);
    this.authorName = props.authorName;
    this.timestamp = props.timestamp;
    this.content = props.content;
  }

  public get uniqueId(): number {
    return this.id;
  }

  public get author(): string {
    return this.authorName;
  }

  public get savedDate(): Date {
    return this.timestamp;
  }

  public get postContent(): string {
    return this.content;
  }

  public get savedData(): object {
    return {
      id: this.id,
      author: this.authorName,
      timestamp: this.timestamp,
      content: this.content
    };
  }
}
