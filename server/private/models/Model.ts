import {
  MongoClient,
  Collection,
  Db,
  InsertOneWriteOpResult,
  InsertWriteOpResult,
  ObjectID
} from 'mongodb';

const databaseName: string | undefined = process.env.MONGO_DB_NAME || '';
const uri: string | undefined = process.env.MONGO_URI || '';

type ExtraReturnOptions = {
  insertedId?: string;
  insertedCount?: number;
  ops?: any[];
};

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
    dataObjs: object | object[],
    extraInfoToReturn?: ['insertedCount' | 'insertedId' | 'ops']
  ): Promise<[Error, ExtraReturnOptions]> {
    try {
      const collection = await this.databaseCollection;
      const result:
        | InsertOneWriteOpResult
        | InsertWriteOpResult = !Array.isArray(dataObjs)
        ? await collection.insertOne(dataObjs)
        : await collection.insertMany(dataObjs as any[]);

      await this.reset_connection();

      const resultToReturn: ExtraReturnOptions = {};

      if (extraInfoToReturn) {
        for (const infoRequested of extraInfoToReturn) {
          switch (infoRequested) {
            case 'insertedId':
              resultToReturn.insertedId = result.insertedId;
              break;
            case 'insertedCount':
              resultToReturn.insertedCount = result.insertedCount;
              break;
            case 'ops':
              resultToReturn.ops = [...result.ops];
              break;
          }
        }
      }

      return [null, resultToReturn];
    } catch (error) {
      return error instanceof Error ? [error, null] : [new Error(error), null];
    }
  }
}
