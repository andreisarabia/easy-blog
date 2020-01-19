import { promises as fs } from 'fs';
import { resolve } from 'path';

const array_unique = (arr: any[]): any[] => [...new Set(arr)];

const is_url = (url: string) => {
  try {
    return Boolean(new URL(url));
  } catch {
    return false;
  }
};

async function* read_dir_recursively(
  dir: string
): AsyncIterableIterator<string> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* read_dir_recursively(res);
    } else {
      yield res;
    }
  }
}

export { array_unique, is_url, read_dir_recursively };
