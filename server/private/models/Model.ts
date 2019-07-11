import Database from '../../src/Database';

export default class Model {
  protected db: Database = new Database();

  protected create_sql_placeholders(numPlaceholders: number): string {
    return '?, '.repeat(numPlaceholders - 1) + '?';
  }
}
