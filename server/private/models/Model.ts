import Database from '../../src/Database';

type QueryResults = {
  insertedId?: string;
  insertedCount?: number;
  ops?: object[];
};

type SearchCriteria = {
  collection: string;
  criteria: object;
  limit: number;
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

  protected static async search({
    collection,
    criteria,
    limit
  }: SearchCriteria): Promise<object | object[]> {
    return Database.instance(collection).find(criteria, { limit: limit || 1 });
  }

  public valueOf(): object {
    return this.props;
  }
}
