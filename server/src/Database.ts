import {
  Collection,
  FilterQuery,
  FindOneOptions,
  InsertOneWriteOpResult,
  InsertWriteOpResult,
  MongoClient
} from 'mongodb';

const dbMap: Map<string, Database> = new Map();
const dbClient: Promise<MongoClient> = MongoClient.connect(
  process.env.MONGO_URI || ' mongodb://127.0.0.1:27017/easy_blog',
  { useNewUrlParser: true, useUnifiedTopology: true }
);

type QueryResults = {
  insertedId?: string;
  insertedCount?: number;
  ops?: object[];
};

export default class Database {
  private dbCollection: Promise<Collection>;

  private constructor({ dbCollectionName }: { dbCollectionName: string }) {
    this.dbCollection = new Promise(resolve =>
      dbClient.then(client => resolve(client.db().collection(dbCollectionName)))
    );
  }

  public static async shutdown_all_connections(): Promise<[boolean, Error]> {
    try {
      const client = await dbClient;
      await client.close();
      return [true, null];
    } catch (error) {
      return [false, error];
    }
  }

  public async insert(
    dataObjs: object | object[],
    extraInfoToReturn?: ['insertedCount' | 'insertedId']
  ): Promise<[Error, QueryResults]> {
    try {
      const collection = await this.dbCollection;

      const result:
        | InsertWriteOpResult
        | InsertOneWriteOpResult
        | any = Array.isArray(dataObjs)
        ? await collection.insertMany(dataObjs as any[])
        : await collection.insertOne(dataObjs);

      const resultToReturn: QueryResults = { ops: result.ops };

      if (!extraInfoToReturn) return [null, resultToReturn];

      for (const infoRequested of extraInfoToReturn) {
        switch (infoRequested) {
          case 'insertedCount':
            resultToReturn.insertedCount = result.insertedCount;
            break;
          case 'insertedId':
            resultToReturn.insertedId = result.insertedId;
            break;
        }
      }

      return [null, resultToReturn];
    } catch (error) {
      return [error, null];
    }
  }

  public async find(
    documentCriteria: FilterQuery<any>,
    options?: FindOneOptions
  ): Promise<object | object[]> {
    const collection = await this.dbCollection;

    return options && options.limit === 1
      ? collection.findOne(documentCriteria)
      : collection.find(documentCriteria, options).toArray();
  }

  public static instance(dbCollectionName: string): Database {
    if (!dbMap.has(dbCollectionName)) {
      dbMap.set(dbCollectionName, new Database({ dbCollectionName }));
    }
    return dbMap.get(dbCollectionName);
  }
}
