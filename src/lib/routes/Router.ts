import { promises as fs, read } from 'fs';
import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import ejs from 'ejs';
import { file_path_from_base, read_dir_recursively } from '../../util/fns';

type RouterOptions = {
  routerPrefix: string;
  templatePath?: string;
};

export default class Router {
  protected instance: KoaRouter;
  private pathMap: Map<string, string[]> = new Map();
  private cachedTemplates: Map<string, Promise<string>>; // we don't initialize caching templates, so any router child can be API-only
  private templatePath: string;

  constructor({ routerPrefix, templatePath }: RouterOptions) {
    this.instance = new KoaRouter({ prefix: `${routerPrefix}/` });
    if (templatePath) {
      this.templatePath = `templates/${templatePath}`;
      this.setup_templates();
    }
  }

  protected async setup_templates() {
    const start = Date.now();
    this.cachedTemplates = this.cachedTemplates || new Map();

    for await (const filePath of read_dir_recursively(this.templatePath)) {
      const { dir } = path.parse(filePath);
      const newBasePath = dir.slice(dir.indexOf(this.templatePath));
      this.cachedTemplates.set(
        `${newBasePath}/${path.basename(filePath)}`,
        fs.readFile(filePath, { encoding: 'utf-8' })
      );
    }

    console.log(
      `${Date.now() - start}ms to load templates in ${this.templatePath}`
    );
  }

  public get middleware(): KoaRouter {
    return this.instance;
  }

  public get allPaths(): Map<string, string[]> {
    if (this.pathMap.size > 0) return this.pathMap;

    for (const { path, methods } of this.instance.stack) {
      if (path.includes('.*')) continue;
      if (this.pathMap.has(path)) {
        const savedPaths = this.pathMap.get(path);
        this.pathMap.set(path, [...savedPaths, ...methods]);
      } else {
        this.pathMap.set(path, methods);
      }
    }

    return this.pathMap;
  }

  protected async render(
    templateName: string,
    data?: object | any
  ): Promise<string> {
    const [universalTemplate, requestedTemplate] = await Promise.all([
      this.cachedTemplates.get(`${this.templatePath}/template.ejs`),
      this.cachedTemplates.get(`${this.templatePath}/${templateName}`)
    ]);
    const { title = 'Easy Blog', ...restOfData } = data || {};
    const template = await ejs.render(
      requestedTemplate,
      { ...restOfData },
      { async: true }
    );

    return ejs.render(universalTemplate, { template, title }, { async: true });
  }
}
