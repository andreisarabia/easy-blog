"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const dbMap = new Map();
const dbClient = mongodb_1.MongoClient.connect(process.env.MONGO_URI || '', { useNewUrlParser: true });
class Database {
    constructor({ dbCollectionName }) {
        this.dbCollectionName = dbCollectionName;
    }
    get dbCollection() {
        return new Promise(async (resolve) => {
            const client = await dbClient;
            resolve(client.db().collection(this.dbCollectionName));
        });
    }
    async insert(dataObjs, extraInfoToReturn) {
        try {
            const collection = await this.dbCollection;
            const result = Array.isArray(dataObjs)
                ? await collection.insertMany(dataObjs)
                : await collection.insertOne(dataObjs);
            const resultToReturn = { ops: result.ops };
            if (!extraInfoToReturn)
                return [null, resultToReturn];
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
        }
        catch (error) {
            return [error, null];
        }
    }
    async find(documentCriteria, options) {
        const collection = await this.dbCollection;
        return options && options.limit === 1
            ? collection.findOne(documentCriteria)
            : collection.find(documentCriteria, options).toArray();
    }
    static instance(dbCollectionName) {
        if (!dbMap.has(dbCollectionName)) {
            dbMap.set(dbCollectionName, new Database({ dbCollectionName }));
        }
        return dbMap.get(dbCollectionName);
    }
}
exports.default = Database;
