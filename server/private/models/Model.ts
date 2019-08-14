import Database from '../../src/Database';

type QueryResults = {
  insertedId?: string;
  insertedCount?: number;
  ops?: object[];
};

export default class Model {
  private db: Database;
  protected props: object;

  protected constructor(collection: string, props: object) {
    this.db = Database.instance(collection);
    this.props = { ...props };
  }

  protected async save({
    includeInResults
  }: {
    includeInResults: ['insertedCount' | 'insertedId'];
  }): Promise<[Error, QueryResults] | any> {
    return this.db.insert(this.props, includeInResults);
  }

  protected static async find(
    collection: string,
    criteria: object,
    limit: number = 0
  ): Promise<object | object[]> {
    return Database.instance(collection).find(criteria, { limit });
  }

  public valueOf(): object {
    return this.props;
  }
}
