import { promises as fs } from 'fs';
import { resolve } from 'path';

const array_unique = (arr: any[]): any[] => [...new Set(arr)];

const file_path_from_base = (filePath: string, cutoff: string): string =>
  filePath.substring(
    filePath.indexOf(cutoff) + cutoff.length + 1,
    filePath.length
  );

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

export { array_unique, file_path_from_base, read_dir_recursively };
