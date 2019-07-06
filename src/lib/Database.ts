import * as mysql from 'mysql';

class Database {
  private connection: mysql.Connection;

  public async query(sql: string, params?: any[], mapCb?: () => any) {}
}

export default Database;
