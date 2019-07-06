import Model from './Model';

export default class BlogPost extends Model {
  constructor(props: object) {
    super(props);
  }

  private get databaseColumns() {
    return Object.keys(this.props);
  }

  public async save(): Promise<void> {
    const columns = this.databaseColumns;
    const sql = `INSERT INTO blog_posts (${columns}) VALUES (${super.create_sql_placeholders(
      columns.length
    )})`;

    return;
  }
}
