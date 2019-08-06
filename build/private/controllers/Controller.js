"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("../../src/Database"));
class Controller {
    constructor(dbCollectionName) {
        this.db = Database_1.default.instance(dbCollectionName);
    }
    async find(dbCriteria = {}) {
        const documents = await this.db.find(dbCriteria);
        return documents;
    }
}
exports.default = Controller;
