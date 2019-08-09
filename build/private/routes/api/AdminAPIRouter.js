"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = __importDefault(require("../../../src/Router"));
const BlogPost_1 = __importDefault(require("../../models/BlogPost"));
const BlogPostController_1 = __importDefault(require("../../controllers/BlogPostController"));
const log = console.log;
class AdminAPIRouter extends Router_1.default {
    constructor() {
        super({ prefix: 'api/' });
        this.blogCache = new Map();
        BlogPostController_1.default.find_all().then(posts => posts.forEach(post => this.blogCache.set(post.id, post)));
        this.instance
            .put('posts', ctx => this.create_post(ctx))
            .get('posts/:id', ctx => this.send_blog_data(ctx))
            .post('posts/:id', ctx => this.act_on_post(ctx))
            .post('user/update', ctx => this.update_user_permissions(ctx));
    }
    async create_post(ctx) {
        const { title, authorName, htmlContent, rawQuillData } = ctx.request
            .body;
        const blogPost = await new BlogPost_1.default({
            title,
            author: authorName,
            htmlContent,
            quillData: rawQuillData,
            timestamp: new Date()
        }).save();
        if (this.blogCache.has(blogPost.previousId)) {
            this.blogCache.delete(blogPost.previousId);
        }
        this.blogCache.set(blogPost.id, blogPost);
        log(blogPost);
        ctx.body = { id: blogPost.id, htmlContent };
    }
    async send_blog_data(ctx) {
        const { id } = ctx.params;
        const blogPost = this.blogCache.get(id);
        log(blogPost);
        ctx.body = { content: blogPost.info };
    }
    async act_on_post(ctx) {
        const { action } = ctx.request.body;
    }
    async update_user_permissions(ctx) {
    }
}
exports.default = AdminAPIRouter;
