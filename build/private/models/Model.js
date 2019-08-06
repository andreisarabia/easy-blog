"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("../../src/Database"));
class Model {
    constructor(collection, props) {
        this.db = Database_1.default.instance(collection);
        this.props = { ...props };
    }
    async save({ includeInResults }) {
        return this.db.insert(this.props, includeInResults);
    }
    async find(criteria, limit = 0) {
        return this.db.find(criteria, { limit });
    }
    valueOf() {
        return this.props;
    }
}
exports.default = Model;
