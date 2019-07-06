import { promises as fs, read } from 'fs';
import KoaRouter from 'koa-router';
import ejs from 'ejs';
import { file_path_from_base, read_dir_recursively } from '../../util/fns';

export default class Router {
  protected instance: KoaRouter;
  private pathMap: Map<string, string[]> = null;
  private templates: Map<string, Promise<string>> = new Map();
  private templatePath: string;

  constructor(prefix: string, templatePath?: string) {
    this.instance = new KoaRouter({ prefix });
    this.templatePath = `templates/${templatePath}`;
  }

  protected async setup() {
    for await (const filePath of read_dir_recursively(this.templatePath)) {
      const fileBasePath = file_path_from_base(filePath, this.templatePath);
      this.templates.set(
        `${this.templatePath}/${fileBasePath}`,
        Promise.resolve((await fs.readFile(filePath)).toString())
      );
    }
  }

  public get middleware(): KoaRouter {
    return this.instance;
  }

  public get allPaths(): Map<string, string[]> {
    this.pathMap =
      this.pathMap ||
      this.instance.stack.reduce((paths, { path, methods }) => {
        if (path.includes('.*')) return paths;
        if (paths.has(path)) {
          paths.set(path, [...this.pathMap.get(path), ...methods]);
        } else {
          paths.set(path, [...methods]);
        }
        return paths;
      }, new Map());

    return this.pathMap;
  }

  protected async render(
    templateName: string,
    data?: ejs.Options
  ): Promise<string> {
    const templates = await this.templates.get(
      `${this.templatePath}/${templateName}`
    );
    return ejs.compile(templates, data)();
  }
}
