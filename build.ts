import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { NextRequest } from 'next/server';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { finishBuildDoc, startBuildDoc } from './src/openapi';
import { mockRequest } from './src/testutils';

const transpiler = new Bun.Transpiler({
  loader: 'tsx',
});

async function start (base: string, cwd: string) {
  const dir = path.resolve(cwd, base);
  console.log('try', dir)
  if (!await fs.exists(dir)) {
    console.log('[docgen] not found:', dir)
    return [];
  }

  const glob = new Bun.Glob(`**/route.{ts,js}`);

  const paths: { method: string, routePath: string, filePath: string }[] = [];

  for await (const item of glob.scan({ cwd: dir })) {
    const filePath = path.join(dir, item);
    const routePath = '/' + item.replace(/\/route\.[tj]s$/, '');

    const { exports } = transpiler.scan(await Bun.file(filePath).text());
    for (let method of exports) {
      if (/^(GET|POST|PATCH|DELETE)$/.test(method)) {
        paths.push({
          method,
          routePath,
          filePath,
        });
      }
    }
  }

  return paths;
}

async function buildAll (cwd = process.cwd()) {
  const paths = await Promise.all([
    start('src/app', cwd),
    start('app', cwd),
  ]).then(groups => groups.flatMap(g => g));

  startBuildDoc();
  for (let { method, routePath, filePath } of paths) {
    const module = await import(filePath);
    const pathname = routePath
      .replace(/\[\[(?:\.{3})?([^\]]+)]]/g, (_, value) => {
        return `{${value}}`;
      })
      .replace(/\[((?:\.{3})?[^\]]+)]/g, (_, value) => {
        return `{${value}}`;
      });
    const url = new URL(pathname, 'http://localhost:3000');

    console.log(`[docgen] ${method}:${routePath} -> ${pathname}`);
    const response = await mockRequest(routePath, module[method], new NextRequest(url, {
      method, headers: {
        accept: 'x-application/api-doc-fragment',
      },
    }));

    if (!response.ok) {
      console.error(`failed for ${method}:${routePath}`);
    }
  }
  const registry = finishBuildDoc();

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.1.0',
    servers: [{ url: 'http://localhost:3000', description: 'Dev' }],
    info: { title: 'dev', version: '0.0.0' },
  });
}

buildAll('__tests__').then(json => {
  Bun.write('openapi.json', JSON.stringify(json, undefined, 2));
});
