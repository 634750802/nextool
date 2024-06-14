import { act, render, type RenderOptions } from '@testing-library/react';
import { isNotFoundError } from 'next/dist/client/components/not-found';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { PathnameContext, PathParamsContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { searchParamsToUrlQuery } from 'next/dist/shared/lib/router/utils/querystring';
import { getRouteMatcher } from 'next/dist/shared/lib/router/utils/route-matcher';
import { getRouteRegex } from 'next/dist/shared/lib/router/utils/route-regex';
import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { createElement, Fragment, type ReactNode } from 'react';
import { isElement } from 'react-is';
import { getCallerFile } from './internals/getCallerFile';
import { searchNextProject } from './internals/searchNextProject';

type RouteContext = { params: Record<string, string | string[]>, searchParams?: Record<string, string | string[] | undefined> };
type RouteHandler = (request: NextRequest, context: RouteContext) => Response | Promise<Response>
type PageComponent = (context: RouteContext) => ReactNode;
type LayoutComponent = (context: { params: Record<string, string | string[]>, children: ReactNode }) => ReactNode;

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

export async function mockAppRoutePage (
  pathnameWithSearchParams: string | URL,
  renderOptions?: Omit<RenderOptions, 'queries'>,
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
  const suffixRegexp = /\/page\.test\.[jt]sx?$/;

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

  const pageFilePath = require.resolve(callerFile.replace(suffixRegexp, '/page'));
  const filename = require.resolve(pageFilePath);

  const Page: PageComponent | undefined = await import(pageFilePath).then(module => module.default);

  if (!Page) {
    throw new Error(`page not exported from ${path.relative(proj, pageFilePath)}`);
  }

  const content = await readFile(filename, { encoding: 'utf8' });

  const firstLine = content.trim().split('\n')[0];
  const isClientModule = firstLine.startsWith(`'use client';`) || firstLine.startsWith(`"use client"`);

  const url = new URL(pathnameWithSearchParams, 'http://localhost:3000/');

  const { params, searchParams } = parseRequestContext(url, routePath);
  const Provider = createAppRouterContextProvider(url, params);

  return await act(async () => render(
    createElement(Provider, undefined,
      isClientModule
        ? createElement(Page, { params, searchParams })
        : await createServerElement(Page, { params, searchParams }),
    ),
    renderOptions,
  ));
}

export async function mockAppRouteLayout (
  pathnameWithSearchParams: string | URL,
  children?: ReactNode,
  renderOptions?: Omit<RenderOptions, 'queries'>,
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
  const suffixRegexp = /\/layout\.test\.[jt]sx?$/;

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

  const pageFilePath = require.resolve(callerFile.replace(suffixRegexp, '/layout'));
  const filename = require.resolve(pageFilePath);

  const Layout: LayoutComponent | undefined = await import(pageFilePath).then(module => module.default);

  if (!Layout) {
    throw new Error(`page not exported from ${path.relative(proj, pageFilePath)}`);
  }

  const content = await readFile(filename, { encoding: 'utf8' });

  const firstLine = content.trim().split('\n')[0];
  const isClientModule = firstLine.startsWith(`'use client';`) || firstLine.startsWith(`"use client"`);

  const url = new URL(pathnameWithSearchParams, 'http://localhost:3000/');

  const { params } = parseRequestContext(url, routePath);
  const Provider = createAppRouterContextProvider(url, params);

  return await act(async () => render(
    createElement(Provider, undefined,
      isClientModule
        ? createElement(Layout, { params, children })
        : await createServerElement(Layout, { params, children })),
    renderOptions,
  ));
}

function createAppRouterContextProvider (url: URL, params: any) {
  return function Provider ({ children }: { children: ReactNode }) {
    let el = children;
    el = createElement(PathnameContext.Provider, { value: url.pathname, children: el });
    el = createElement(SearchParamsContext.Provider, { value: url.searchParams, children: el });
    el = createElement(PathParamsContext.Provider, { value: params, children: el });

    return el;
  };
}

async function createServerElement<P> (Component: (props: P) => Promise<ReactNode> | ReactNode, props: P) {
  const el = await Component(props);

  if (isElement(el)) {
    return el;
  }

  return createElement(Fragment, undefined, el);
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
