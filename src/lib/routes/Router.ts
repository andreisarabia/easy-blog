import KoaRouter from 'koa-router';
import koaStatic from 'koa-static';
import ejs from 'ejs';
import { promises as fs } from 'fs';
import path from 'path';
import { read_dir_recursively } from '../../util/fns';

const log = console.log;

const TEN_SECONDS_IN_MS = 10000;

type RouterOptions = {
  routerPrefix: string;
  templatePath?: string;
  assetsPath?: string;
};

export default class Router {
  protected instance: KoaRouter;
  private pathMap: Map<string, string[]> = new Map();
  private cachedTemplates: Map<string, Promise<string>>; // we don't initialize caching templates, so any router child can be API-only
  private templatePath: string;

  constructor({ routerPrefix, templatePath, assetsPath }: RouterOptions) {
    this.instance = new KoaRouter({ prefix: `${routerPrefix}/` });

    if (templatePath) {
      this.templatePath = `templates${path.sep}${templatePath}`;
      this.setup_templates();
    }

    if (assetsPath) {
      const defaultStaticOptions = { maxAge: TEN_SECONDS_IN_MS, defer: true };
      this.instance.use(
        koaStatic(`assets${path.sep}${assetsPath}`, defaultStaticOptions)
      );
    }
  }

  protected async setup_templates(): Promise<void> {
    const start = Date.now();
    this.cachedTemplates = this.cachedTemplates || new Map();

    for await (const filePath of read_dir_recursively(this.templatePath)) {
      const { dir } = path.parse(filePath);
      const newBasePath = dir.slice(dir.indexOf(this.templatePath));
      this.cachedTemplates.set(
        `${newBasePath}${path.sep}${path.basename(filePath)}`,
        fs.readFile(filePath, { encoding: 'utf-8' })
      );
    }

    log(`${Date.now() - start}ms to load templates in ${this.templatePath}`);
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
      this.cachedTemplates.get(`${this.templatePath}${path.sep}template.ejs`),
      this.cachedTemplates.get(`${this.templatePath}${path.sep}${templateName}`)
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
