"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const koa_1 = __importDefault(require("koa"));
const koa_mount_1 = __importDefault(require("koa-mount"));
const koa_session_1 = __importDefault(require("koa-session"));
const koa_body_1 = __importDefault(require("koa-body"));
const koa_csrf_1 = __importDefault(require("koa-csrf"));
const AdminApplication_1 = __importDefault(require("./private/AdminApplication"));
const UserApplication_1 = __importDefault(require("./public/UserApplication"));
const main = async () => {
    const app = new koa_1.default();
    const appPort = +process.env.PORT || 3000;
    const sessionConfig = {
        key: '_easy_blog',
        maxAge: 100000,
        overwrite: true,
        signed: true,
        httpOnly: true
    };
    app.keys = ['easy-blog-visitor'];
    app
        .use(koa_session_1.default(sessionConfig, app))
        .use(koa_body_1.default({ json: true, multipart: true }))
        .use(new koa_csrf_1.default())
        .use(koa_mount_1.default('/', UserApplication_1.default.middleware))
        .use(koa_mount_1.default('/admin', AdminApplication_1.default.middleware))
        .listen(appPort, () => console.log('Listening...'));
};
main().catch(console.error);
