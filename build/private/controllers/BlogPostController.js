"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Controller_1 = __importDefault(require("./Controller"));
const BlogPost_1 = __importDefault(require("../models/BlogPost"));
const databaseCollection = 'blog_posts';
class BlogPostController extends Controller_1.default {
    async find_all() {
        const documents = (await super.find({}));
        return documents.map(doc => new BlogPost_1.default(doc));
    }
}
exports.default = new BlogPostController('blog_posts');
