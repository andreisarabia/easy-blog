import { promises as fs } from 'fs';
import { resolve } from 'path';
import uuid from 'uuid';

const array_unique = (arr: any[]): any[] => [...new Set(arr)];

const file_path_from_base = (filePath: string, cutoff: string): string =>
  filePath.substring(
    filePath.indexOf(cutoff) + cutoff.length + 1,
    filePath.length
  );

const is_url = (url: any) => {
  try {
    return Boolean(new URL(url));
  } catch (error) {
    return false;
  }
};

const random_id = () => `${Date.now().toString()}-${uuid()}`;

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

export {
  array_unique,
  is_url,
  file_path_from_base,
  random_id,
  read_dir_recursively
};
