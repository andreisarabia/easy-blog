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
  process.env.MONGO_URI || '',
  { useNewUrlParser: true }
);

type QueryResults = {
  insertedId?: string;
  insertedCount?: number;
  ops?: object[];
};

export default class Database {
  private dbCollectionName: string;

  private constructor({ dbCollectionName = '' }: { dbCollectionName: string }) {
    this.dbCollectionName = dbCollectionName;
  }

  private get dbCollection(): Promise<Collection> {
    return new Promise(async resolve => {
      const client = await dbClient;
      resolve(client.db().collection(this.dbCollectionName));
    });
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
