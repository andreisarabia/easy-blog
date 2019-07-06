import { promises as fs, read } from 'fs';
import path from 'path';
import KoaRouter from 'koa-router';
import ejs from 'ejs';
import { file_path_from_base, read_dir_recursively } from '../../util/fns';

export default class Router {
  protected instance: KoaRouter;
  private pathMap: Map<string, string[]> = null;
  private templates: Map<string, Promise<string>> = null;
  private templatePath: string;

  constructor(prefix: string, templatePath?: string) {
    this.instance = new KoaRouter({ prefix });
    this.templatePath = `templates/${templatePath}`;
  }

  protected async setup_templates() {
    if (this.templates) return this.templates;

    this.templates = new Map();

    for await (const filePath of read_dir_recursively(this.templatePath)) {
      const { dir } = path.parse(filePath);
      const newBasePath = dir.slice(dir.indexOf(this.templatePath));
      const fileName = path.basename(filePath);
      const templateKey = `${newBasePath}/${fileName}`;

      this.templates.set(
        templateKey,
        fs.readFile(filePath, { encoding: 'utf-8' })
      );
    }
  }

  public get middleware(): KoaRouter {
    return this.instance;
  }

  public get allPaths(): Map<string, string[]> {
    if (this.pathMap) return this.pathMap;

    const paths = this.instance.stack.reduce(
      (paths, { path, methods }) =>
        path.includes('.*') ? paths : paths.concat([[path, methods]]),
      []
    );

    this.pathMap = new Map(paths);

    return this.pathMap;
  }

  protected async render(
    templateName: string,
    data: object = {}
  ): Promise<string> {
    const [universalTemplate, requestedTemplate] = await Promise.all([
      this.templates.get(`${this.templatePath}/template.ejs`),
      this.templates.get(`${this.templatePath}/${templateName}`)
    ]);
    const renderData = {
      template: requestedTemplate,
      ...data
    };

    return ejs.render(universalTemplate, { ...renderData }, { async: true });
  }
}
