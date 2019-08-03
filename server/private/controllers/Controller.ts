import Database from '../../src/Database';

export default class Controller {
  private db: Database;

  constructor(dbCollectionName: string) {
    this.db = Database.instance(dbCollectionName);
  }

  protected async find(dbCriteria: object = {}) {
    const documents = await this.db.find(dbCriteria);

    return documents;
  }
}
