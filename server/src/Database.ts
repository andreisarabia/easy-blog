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

type QueryResults = {
  insertedId?: string;
  insertedCount?: number;
  ops?: object[];
};

export default class Database {
  private dbClient: MongoClient = new MongoClient(uri);
  private dbCollection: Collection;

  constructor({ dbCollectionName = '' }: { dbCollectionName: string }) {
    this.dbCollection = this.dbClient.db(dbCollectionName);
  }

  private async reset_connection() {
    await this.dbClient.close();
  }

  public async insert(
    dataObjs: object | object[],
    extraInfoToReturn?: ['insertedCount' | 'insertedId']
  ): Promise<[Error, QueryResults]> {
    try {
      const result:
        | InsertWriteOpResult
        | InsertOneWriteOpResult = Array.isArray(dataObjs)
        ? await this.dbCollection.insertMany(dataObjs as any[])
        : await this.dbCollection.insertOne(dataObjs);

      const resultToReturn: QueryResults = { ops: result.ops };

      if (!extraInfoToReturn) return [null, resultToReturn];

      for (const infoRequested of extraInfoToReturn) {
        switch (infoRequested) {
          case 'insertedId':
            resultToReturn.insertedId = result.insertedId;
            break;
          case 'insertedCount':
            resultToReturn.insertedCount = result.insertedCount;
            break;
        }
      }

      return [null, resultToReturn];
    } catch (error) {
      return [error, null];
    }
  }
}
