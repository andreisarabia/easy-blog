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
  private db: Db;
  protected dbCollectionName: string;
  protected props: object = {};

  constructor(dbCollectionName: string, props: object) {
    this.dbCollectionName = dbCollectionName;
    this.props = props;

    // for (const key in props) this.props[key] = props[key];
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
        | InsertWriteOpResult
        | InsertOneWriteOpResult = Array.isArray(dataObjs)
        ? await collection.insertMany(dataObjs as any[])
        : await collection.insertOne(dataObjs);

      this.reset_connection();

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
      return [error, null];
    }
  }

  public valueOf(): object {
    return { ...this.props };
  }
}
