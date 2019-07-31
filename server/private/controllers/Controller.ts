import Database from '../../src/Database';

export default class Controller {
  private db = Database;

  constructor({ collection }: { collection: string }) {
    this.db = new Database({ dbCollectionName: collection });
  }

  protected async find() {}
}
