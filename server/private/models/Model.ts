import { MongoClient, Collection, Db } from 'mongodb';

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

  protected async insert(...a: object[]): Promise<void> {
    const collection = await this.databaseCollection;

    const result: InsertOneWriteOpResult | InsertWriteOpResult =
      a.length === 1
        ? await collection.insertOne(a)
        : await collection.insertMany(a);

      
  }
}
