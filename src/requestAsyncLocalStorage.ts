import type { NextRequest } from 'next/server';
import { AsyncLocalStorage } from 'node:async_hooks';

export type ParamsDict = Record<string, string | readonly string[]>;

export interface RequestContext<
  P extends ParamsDict = ParamsDict,
  S extends ParamsDict = ParamsDict,
> {
  params: P;
  searchParams?: S;
}

export type RouteResponseParser<T> = {
  test: (target: unknown) => boolean
  toResponse: (target: T) => Response | Promise<Response>
}

export type RouteStreamEncoder<T> = {
  encode (data: T): Uint8Array;
}

export interface RequestAsyncLocalStorage {
  responseHeadersMutations: ((headers: Headers) => void)[];
  responseHandlers: RouteResponseParser<any>[];
  exceptionHandlers: RouteResponseParser<any>[];
  streamEncoder?: RouteStreamEncoder<any>;
}

export type RouteHandler = (request: NextRequest, context: RequestContext) => Response | Promise<Response>

export const requestAsyncLocalStorage = new AsyncLocalStorage<RequestAsyncLocalStorage>();

export function requestStore () {
  const store = requestAsyncLocalStorage.getStore();
  if (!store) {
    throw new Error('Not in a request context.');
  }

  return store;
}

export function mutateResponseHeaders (mutation: (headers: Headers) => void) {
  return requestStore().responseHeadersMutations.push(mutation);
}

export function responseStreamEncoder () {
  return requestStore().streamEncoder;
}
