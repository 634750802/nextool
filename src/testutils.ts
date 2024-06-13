import { isNotFoundError } from 'next/dist/client/components/not-found';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { searchParamsToUrlQuery } from 'next/dist/shared/lib/router/utils/querystring';
import { getRouteMatcher } from 'next/dist/shared/lib/router/utils/route-matcher';
import { getRouteRegex } from 'next/dist/shared/lib/router/utils/route-regex';
import { NextRequest } from 'next/server';
import * as path from 'node:path';
import { getCallerFile } from './internals/getCallerFile';
import { searchNextProject } from './internals/searchNextProject';

type RouteContext = { params: Record<string, string | string[]>, searchParams?: Record<string, string | string[] | undefined> };
type RouteHandler = (request: NextRequest, context: RouteContext) => Response | Promise<Response>

/**
 * This method must be called in same directory with `route.{tj}s`, and the file must be named as `route.test.{tj}s`.
 *
 * TODO: consider middleware handler
 *
 * @param pathnameWithSearchParams
 * @param init
 */
export async function mockAppRouteRequest (
  pathnameWithSearchParams: string | URL,
  init?: RequestInit,
) {
  // Find the caller file and next project
  const callerFile = getCallerFile(2);
  const proj = await searchNextProject(callerFile);
  if (!proj) {
    throw new Error('Next project not found');
  }

  // Resolve the testing route handler file.
  let routePath = path.relative(proj, callerFile);
  const prefixRegexp = /^(?:src\/)?app/;
  const suffixRegexp = /\/route\.test\.(?:[mc]?j|t)s$/;

  if (prefixRegexp.test(routePath)) {
    routePath = routePath.replace(prefixRegexp, '');
  } else {
    throw new Error('mockAppRouteRequest must be placed in app router dir');
  }

  if (suffixRegexp.test(routePath)) {
    routePath = routePath.replace(suffixRegexp, '');
  } else {
    throw new Error('mockAppRouteRequest must be named route.test.[jt]s');
  }

  // Dynamic resolve the http method handler defined in requestInit (default is GET)
  const method = init?.method?.toUpperCase() ?? 'GET';
  const routeFilePath = require.resolve(callerFile.replace(suffixRegexp, '/route'));
  const handler: RouteHandler | undefined = await import(routeFilePath).then(module => module[method]);
  if (!handler) {
    throw new Error(`${method} method not exported from ${path.relative(proj, routeFilePath)}`);
  }

  // Mock a request
  // https://github.com/nodejs/node/issues/46221
  if (init?.body instanceof ReadableStream) {
    init = { ...init, duplex: 'half' } as RequestInit;
  }

  const url = new URL(pathnameWithSearchParams, 'http://localhost:3000/');
  const request = new NextRequest(url, init as any);

  return await mockRequest(routePath, handler, request);
}

export async function mockRequest (routePath: string, handler: RouteHandler, request: NextRequest) {
  // Use next provided functions to mock a request context (secondary parameter of handler method).
  const context = parseRequestContext(new URL(request.url), routePath);

  // Execute the handler
  try {
    return await handler(request, context);
  } catch (e) {
    if (isNotFoundError(e)) {
      return new Response(undefined, { status: 404 });
    } else if (isRedirectError(e)) {
      return new Response(null, { status: 307 });
    }
    return Promise.reject(e);
  }
}

export function parseRequestContext (url: URL, pathPattern: string): RouteContext {
  const matcher = getRouteMatcher(getRouteRegex(pathPattern));
  const result = matcher(url.pathname);
  if (!result) {
    throw new Error('Cannot match route');
  }
  if (!url.search) {
    return { params: result };
  }
  return {
    params: result,
    searchParams: searchParamsToUrlQuery(url.searchParams),
  };
}
