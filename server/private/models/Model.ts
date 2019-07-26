import {
  MongoClient,
  Collection,
  Db,
  InsertOneWriteOpResult,
  InsertWriteOpResult
} from 'mongodb';

const databaseName: string | undefined = process.env.MONGO_DB_NAME || '';
const uri: string | undefined = process.env.MONGO_URI || '';

export default class Model {
  private dbClient: MongoClient = new MongoClient(uri);
  protected dbCollectionName: string;
  private db: Db;

  constructor(dbCollectionName: string) {
    this.dbCollectionName = dbCollectionName;
  }

  private get databaseCollection(): Promise<Collection> {
    return new Promise(async resolve => {
      this.dbClient = await this.dbClient.connect();

      if (!this.db) {
        this.db = await this.dbClient.db(databaseName);
      }

      resolve(this.db.collection(this.dbCollectionName));
    });
  }

  private async reset_connection() {
    await this.dbClient.close();
  }

  protected async insert(
    dataObjs: object[],
    { extraInfoToReturn }: { extraInfoToReturn?: string[] }
  ): Promise<[Error, object[]]> {
    try {
      const collection = await this.databaseCollection;

      const result: InsertOneWriteOpResult | InsertWriteOpResult =
        dataObjs.length === 1
          ? await collection.insertOne(dataObjs)
          : await collection.insertMany(dataObjs);

      await this.reset_connection();

      return [null, result.ops];
    } catch (error) {
      return error instanceof Error ? [error, null] : [new Error(error), null];
    }
  }
}
