"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const ejs_1 = __importDefault(require("ejs"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const fns_1 = require("../util/fns");
const log = console.log;
class Router {
    constructor({ templatePath, prefix = '/' }) {
        this.pathMap = new Map();
        if (templatePath) {
            this.templatePath = `templates${path_1.default.sep}${templatePath}`;
            this.cachedTemplates = new Map();
            this.refresh_template_cache();
        }
        this.instance = new koa_router_1.default({ prefix });
    }
    get middleware() {
        return this.instance;
    }
    async refresh_template_cache() {
        const start = Date.now();
        for await (const filePath of fns_1.read_dir_recursively(this.templatePath)) {
            const { dir } = path_1.default.parse(filePath);
            const newBasePath = dir.slice(dir.indexOf(this.templatePath));
            this.cachedTemplates.set(`${newBasePath}${path_1.default.sep}${path_1.default.basename(filePath)}`, fs_1.promises.readFile(filePath, { encoding: 'utf-8' }));
        }
        log(`${Date.now() - start}ms to load templates in ${this.templatePath}`);
    }
    get allPaths() {
        this.pathMap.clear();
        for (const { path, methods } of this.instance.stack) {
            if (path.includes('.*'))
                continue;
            this.pathMap.set(path, methods);
        }
        return this.pathMap;
    }
    async render(templateName, data) {
        const [universalTemplate, requestedTemplate] = await Promise.all([
            this.cachedTemplates.get(`${this.templatePath}${path_1.default.sep}template.ejs`),
            this.cachedTemplates.get(`${this.templatePath}${path_1.default.sep}${templateName}`)
        ]);
        const { title = 'Easy Blog', csrf = '', ...restOfData } = data || {};
        const template = await ejs_1.default.render(requestedTemplate, { csrf, ...restOfData }, { async: true });
        const universalData = { title, template, csrf };
        return ejs_1.default.render(universalTemplate, universalData, { async: true });
    }
}
exports.default = Router;
