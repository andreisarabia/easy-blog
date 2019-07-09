import Model from './Model';

 type BlogPostParameters = {
    id: string;
    author: string;
    timestamp: Date;
    content: string;
  };
  
export default class BlogPost extends Model {
  private id: string;
  private author: string;
  private timestamp: Date;
  private content: string;

  constructor(props: BlogPostParameters) {
    super();

    this.id = props.id;
    this.author = props.author;
    this.timestamp = props.timestamp;
    this.content = props.content;
  }
}
