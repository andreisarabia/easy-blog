"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const array_unique = (arr) => [...new Set(arr)];
exports.array_unique = array_unique;
const file_path_from_base = (filePath, cutoff) => filePath.substring(filePath.indexOf(cutoff) + cutoff.length + 1, filePath.length);
exports.file_path_from_base = file_path_from_base;
const is_url = (url) => {
    try {
        return Boolean(new URL(url));
    }
    catch (error) {
        return false;
    }
};
exports.is_url = is_url;
async function* read_dir_recursively(dir) {
    const dirents = await fs_1.promises.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = path_1.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* read_dir_recursively(res);
        }
        else {
            yield res;
        }
    }
}
exports.read_dir_recursively = read_dir_recursively;
