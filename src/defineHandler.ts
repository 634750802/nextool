import type { NextRequest } from 'next/server';
import { undefined } from 'zod';
import { NextRouteErrorParser } from './exceptionParsers/NextRouteErrorParser';
import { ResponseErrorParser } from './exceptionParsers/ResponseErrorParser';
import { ZodErrorParser } from './exceptionParsers/ZodErrorParser';
import { body } from './middlewares';
import { closeRouteDoc, startRouteDoc } from './openapi';
import { DirectResponseParser } from './responseParsers/DirectResponseParser';
import { wrap } from './routeWrapper';
import { type RequestContext, type RouteExceptionParser, type RouteResponseParser } from './types';

const SYMBOL_DOCGEN = Symbol('BaseMiddleware#docGen');
const SYMBOL_FOR_TYPING = Symbol('BaseMiddleware#returnType');

interface BaseMiddleware<T, Returns = unknown> {
  (request: NextRequest, context: RequestContext): Promise<T> | T;

  mutateResponseHeaders?: (headers: Headers) => void;
  addResponseParsers?: RouteResponseParser<any>[];
  addExceptionParsers?: RouteExceptionParser<unknown>[];

  [SYMBOL_DOCGEN]?: () => void;
  [SYMBOL_FOR_TYPING]?: Returns;
}

export interface HandlerMiddleware<Returns = void> extends BaseMiddleware<void, Returns> {
  field?: void;
}

export interface HandlerContextualMiddleware<Field extends string | symbol, Value, Returns = void> extends BaseMiddleware<Value, Returns> {
  field: Field;
}

export function withDocGen<M extends BaseMiddleware<any>> (middleware: M, docGen: () => void): M {
  middleware[SYMBOL_DOCGEN] = docGen;
  return middleware;
}

export function docGenOnly (docGenFn: () => void): HandlerMiddleware {
  return withDocGen(() => {}, docGenFn);
}

export { body, params, searchParams, stream, doc, responseDoc } from './middlewares';

type Resolve<T> =
  T extends HandlerContextualMiddleware<infer Key, infer Value>
    ? { [K in Key]: Value }
    : T extends HandlerMiddleware ? {}
      : never;

type ResolveMiddlewareData<T extends Readonly<(HandlerMiddleware | HandlerContextualMiddleware<any, any>)[]>> =
  T extends []
    ? {}
    : T extends Readonly<[infer Single, ...infer Rest extends (HandlerMiddleware | HandlerContextualMiddleware<any, any>)[]]>
      ? Resolve<Single> & ResolveMiddlewareData<Rest>
      : never

type ResolveReturns<T> =
  T extends BaseMiddleware<any, infer T>
    ? T
    : void

type MergeReturns<A, B> =
  A extends void
    ? B
    : B extends void
      ? A
      : A | B;

type ResolveMiddlewareReturns<T extends Readonly<BaseMiddleware<any>[]>> =
  T extends []
    ? void
    : T extends Readonly<[infer Single, ...infer Rest extends Readonly<BaseMiddleware<any>[]>]>
      ? MergeReturns<ResolveReturns<Single>, ResolveMiddlewareReturns<Rest>>
      : void;

type VoidToAny<T> = T extends void ? any : T;

export interface DefineHandlerProps<
  Use extends readonly (HandlerMiddleware<any> | HandlerContextualMiddleware<any, any, any>)[]
> {
  use?: Readonly<Use>;
}

export function defineHandler<
  Use extends Readonly<(HandlerMiddleware<any> | HandlerContextualMiddleware<any, any, any>)[]>
> (
  { use }: DefineHandlerProps<Use>,
  handle: (data: ResolveMiddlewareData<Use>) => VoidToAny<ResolveMiddlewareReturns<Use>>,
) {
  const responseParsers: RouteResponseParser<any>[] = [
    DirectResponseParser,
  ];
  const exceptionParsers: RouteExceptionParser<any>[] = [
    NextRouteErrorParser,
    ResponseErrorParser,
    ZodErrorParser,
  ];
  const responseHeadersMutations: ((headers: Headers) => void)[] = [];

  use?.forEach(({ addExceptionParsers, mutateResponseHeaders, addResponseParsers }) => {
    if (addExceptionParsers) {
      exceptionParsers.push(...addExceptionParsers);
    }
    if (addResponseParsers) {
      responseParsers.push(...addResponseParsers);
    }
    if (mutateResponseHeaders) {
      responseHeadersMutations.push(mutateResponseHeaders);
    }
  });

  return wrap(async (request, context) => {
    if (isDocGenRequest(request)) {
      startRouteDoc();
      use?.forEach(middleware => {
        middleware[SYMBOL_DOCGEN]?.();
      });
      closeRouteDoc(
        request.method.toLowerCase() as any,
        request.nextUrl.pathname
          .replaceAll(encodeURIComponent('{'), '{')
          .replaceAll(encodeURIComponent('}'), '}'),
      );
      return undefined;
    } else {
      const data = {} as any;

      for (let middleware of use ?? []) {
        const value = await middleware(request, context);
        if (middleware.field) {
          if (middleware.field in data) {
            throw new Error(`Conflict contextual middleware field ${middleware.field}`);
          }
          data[middleware.field] = value;
        }
      }

      return handle(data);
    }
  }, {
    responseParsers,
    exceptionParsers,
    responseHeadersMutations,
  });
}

function isDocGenRequest (request: NextRequest) {
  return request.headers.get('Accept') === 'x-application/api-doc-fragment';
}
