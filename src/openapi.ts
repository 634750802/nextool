import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { RouteConfig } from '@asteasolutions/zod-to-openapi/dist/openapi-registry';
import { z } from 'zod';

extendZodWithOpenApi(z);

let registry: OpenAPIRegistry | undefined;
let currentRouteConfig: Omit<RouteConfig, 'method' | 'path'> | undefined;
let routeMutators: ((operation: Omit<RouteConfig, 'method' | 'path'>) => void)[] | undefined;

export function startBuildDoc () {
  console.log('start build doc')
  if (registry) {
    throw new Error('is already started');
  }
  registry = new OpenAPIRegistry();
}

export function finishBuildDoc () {
  console.log('finish build doc')
  try {
    if (!registry) {
      throw new Error('is not started');
    }
    return registry;
  } finally {
    registry = undefined;
  }
}

export function docRegistry () {
  return registry!;
}

export function mutateOperationDoc (mutator: (path: Omit<RouteConfig, 'method' | 'path'>) => void) {
  routeMutators!.push(mutator);
}

export function startRouteDoc () {
  if (registry) {
    currentRouteConfig = {
      responses: {},
    };
    routeMutators = [];
  }
}

export function closeRouteDoc (method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace', path: string) {
  if (registry && currentRouteConfig && routeMutators) {
    for (let mutator of routeMutators) {
      mutator(currentRouteConfig);
    }

    registry.registerPath({
      ...currentRouteConfig,
      path,
      method,
    });

    currentRouteConfig = undefined;
    routeMutators = undefined;
  }
}
