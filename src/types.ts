import type { NextRequest } from 'next/server';

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
  toResponse: (target: T, mutateHeaders: ((headers: Headers) => void)[]) => Response | Promise<Response>
}

export type RouteExceptionParser<T> = {
  test: (target: unknown) => boolean
  toResponse: (target: T) => Response | Promise<Response>
}

export type RouteStreamEncoder<T> = {
  encode (data: T): Uint8Array;
}
export type RouteHandler = (request: NextRequest, context: RequestContext) => Response | Promise<Response>
