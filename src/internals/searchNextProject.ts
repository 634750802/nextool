import { readdir } from 'node:fs/promises';
import * as path from 'node:path';

export async function searchNextProject (file: string) {
  let cur = path.dirname(file);

  while (cur !== '/') {
    const names = await readdir(cur);
    if (names.some(name => /^next\.config\.(?:[cm]?js|ts)$/.test(name))) {
      return cur;
    }
    cur = path.dirname(cur);
  }

  return undefined;
}
