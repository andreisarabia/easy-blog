"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const koa_1 = __importDefault(require("koa"));
const koa_mount_1 = __importDefault(require("koa-mount"));
const koa_session_1 = __importDefault(require("koa-session"));
const AdminApplication_1 = __importDefault(require("./private/AdminApplication"));
const main = async () => {
    const adminApp = new AdminApplication_1.default();
    const app = new koa_1.default();
    const appPort = +process.env.PORT || 3000;
    app.keys = ['easy-blog-visitor'];
    app
        .use(koa_session_1.default({ key: 'eb-visitor', maxAge: 10000 }, app))
        .use(koa_mount_1.default('/admin', adminApp.middleware))
        .listen(appPort, () => console.log('Listening...'));
};
main().catch(console.error);
