import {
  MongoClient,
  Collection,
  Db,
  InsertOneWriteOpResult,
  InsertWriteOpResult,
  ObjectID
} from 'mongodb';

const dbClient = new MongoClient(process.env.MONGO_URI || '');
const dbMap: Map<string, Database> = new Map();

type QueryResults = {
  insertedId?: string;
  insertedCount?: number;
  ops?: object[];
};

export default class Database {
  private dbCollection: Collection;

  constructor({ dbCollectionName = '' }: { dbCollectionName: string }) {
    this.dbCollection = dbClient.db().collection(dbCollectionName);
  }

  public static instance(dbCollectionName: string): Database {
    if (!dbMap.has(dbCollectionName)) {
      dbMap.set(dbCollectionName, new Database({ dbCollectionName }));
    }
    return dbMap.get(dbCollectionName);
  }

  private async reset_connection() {
    await dbClient.close();
  }

  public async insert(
    dataObjs: object | object[],
    extraInfoToReturn?: ['insertedCount' | 'insertedId']
  ): Promise<[Error, QueryResults]> {
    try {
      const result:
        | InsertWriteOpResult
        | InsertOneWriteOpResult
        | any = Array.isArray(dataObjs)
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

  public async find(documentCriteria: object, mapCb?: Function) {}
}
