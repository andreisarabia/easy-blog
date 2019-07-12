import KoaRouter from 'koa-router';
import ejs from 'ejs';
import { promises as fs } from 'fs';
import path from 'path';
import { read_dir_recursively } from '../util/fns';

const log = console.log;

const TEN_SECONDS_IN_MS = 10000;

type RouterOptions = {
  templatePath?: string;
  prefix?: string;
};

export default class Router {
  protected instance: KoaRouter;
  private pathMap: Map<string, string[]> = new Map();
  private cachedTemplates: Map<string, Promise<string>>; // we don't initialize caching templates, so any router child can be API-only
  private templatePath: string;
  private isRefreshingCache: boolean = false;

  constructor({ templatePath, prefix = '/' }: RouterOptions) {
    if (templatePath) {
      this.templatePath = `templates${path.sep}${templatePath}`;
      this.cachedTemplates = new Map();
      this.refresh_template_cache();
    }

    this.instance = new KoaRouter({ prefix });
  }

  public get middleware(): KoaRouter {
    return this.instance;
  }

  // when no templates in cache, we fill it up;
  // when templates are in cache, we replace each entry with
  // a refreshed read of its file
  protected async refresh_template_cache(): Promise<void> {
    if (this.cachedTemplates.size === 0 || !this.isRefreshingCache) {
      const start = Date.now();
      this.isRefreshingCache = true;
      for await (const filePath of read_dir_recursively(this.templatePath)) {
        const { dir } = path.parse(filePath);
        const newBasePath = dir.slice(dir.indexOf(this.templatePath));
        this.cachedTemplates.set(
          `${newBasePath}${path.sep}${path.basename(filePath)}`,
          fs.readFile(filePath, { encoding: 'utf-8' })
        );
      }
      this.isRefreshingCache = false;
      log(`${Date.now() - start}ms to load templates in ${this.templatePath}`);
    }
  }

  public get allPaths(): Map<string, string[]> {
    if (this.pathMap.size > 0) return this.pathMap;

    for (const { path, methods } of this.instance.stack) {
      if (path.includes('.*')) continue;
      if (this.pathMap.has(path)) {
        const savedPaths = this.pathMap.get(path);
        this.pathMap.set(path, methods.concat(savedPaths));
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
    const { title = 'Easy Blog', csrf = '', ...restOfData } = data || {};
    const template = await ejs.render(
      requestedTemplate,
      { csrf, ...restOfData },
      { async: true }
    );
    const universalData = { title, template, csrf };

    return ejs.render(universalTemplate, universalData, { async: true });
  }
}
