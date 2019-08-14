"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = __importDefault(require("../../src/Router"));
const log = console.log;
const BASE_TITLE = '- Easy Blog';
class PublicRouter extends Router_1.default {
    constructor() {
        super({ templatePath: 'public' });
        this.cache = new Map();
    }
}
exports.default = new PublicRouter();
