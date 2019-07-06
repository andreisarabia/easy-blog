import Database from '../Database';
import ejs from 'ejs';

export default class Model {
  protected props: object;
  protected db: Database = new Database();

  constructor(props = {}) {
    this.props = { ...props };
  }

  protected create_sql_placeholders(numPlaceholders: number): string {
    return '?, '.repeat(numPlaceholders - 1) + '?';
  }
}
