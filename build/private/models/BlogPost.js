"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = __importDefault(require("./Model"));
class BlogPost extends Model_1.default {
    constructor(props) {
        super('blog_posts', props);
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
}
exports.default = BlogPost;
