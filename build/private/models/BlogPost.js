"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = __importDefault(require("./Model"));
class BlogPost extends Model_1.default {
    constructor(props) {
        super(BlogPost.collectionName, props);
    }
    get info() {
        return { ...this.props };
    }
    get id() {
        return this.props._id;
    }
    get postTitle() {
        return this.props.title;
    }
    get author() {
        return this.props.author;
    }
    get datePublished() {
        return this.props.timestamp;
    }
    get html() {
        return this.props.htmlContent;
    }
    get previousId() {
        return this.penultimateId;
    }
    static get collectionName() {
        return 'blog_posts';
    }
    async save() {
        const [error, results] = await super.save({
            includeInResults: ['insertedId']
        });
        if (error)
            throw error;
        if (this.props._id)
            this.penultimateId = this.props._id;
        this.props._id = results.insertedId;
        return this;
    }
    static async find(id) {
        const blogPostData = (await Model_1.default.find(BlogPost.collectionName, { id }, 1));
        return Object.keys(blogPostData).length === 0
            ? null
            : new BlogPost(blogPostData);
    }
}
exports.default = BlogPost;
