import type { RouteConfig } from '@asteasolutions/zod-to-openapi/dist/openapi-registry';
import { notFound } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { type AnyZodObject, undefined, z, type ZodEffects, type ZodType } from 'zod';
import { ContentType, decodeRequestBody } from './decoders/decodeRequestBody';
import { decodeRequestStream, type StreamDecoder } from './decoders/decodeRequestStream';
import { closeRouteDoc, mutateOperationDoc, startRouteDoc } from './openapi';
import { mutateResponseHeaders, type RequestContext } from './requestAsyncLocalStorage';
import { parseParamsDict } from './schema/parseParamsDict';
import { wrap } from './wrap';

interface HandlerMiddleware {
  (request: NextRequest, context: RequestContext): Promise<void> | void;

  field?: void;
}

export interface HandlerContextualMiddleware<Field extends string | symbol, Value> {
  (request: NextRequest, context: RequestContext): Promise<Value> | Value;

  field: Field;
}

function withDocGen<Field extends string | symbol, Value> (fn: HandlerContextualMiddleware<Field, Value>, docGen: () => void): HandlerContextualMiddleware<Field, Value> {
  const middleware: HandlerContextualMiddleware<Field, Value> = (request, context) => {
    if (isDocGenRequest(request)) {
      docGen();
      return undefined as any;
    }
    return fn(request, context);
  };

  middleware.field = fn.field;
  return middleware;
}

function docGen (cb: () => void): HandlerMiddleware {
  return ((request: NextRequest) => {
    if (isDocGenRequest(request)) {
      cb();
    }
  });
}

export function body<Z extends ZodType> (schema: Z): HandlerContextualMiddleware<'body', z.infer<Z>> {
  const middleware: HandlerContextualMiddleware<'body', z.infer<Z>> = (request) => decodeRequestBody(request, schema, { accept: [ContentType.json, ContentType.multipart] });
  middleware.field = 'body';

  return withDocGen(middleware, () => {
    mutateOperationDoc(operation => {
      operation.request = { ...operation.request, body: { content: { 'application/json': { schema } } } };
    });
  });
}

export function params<Z extends AnyZodObject | ZodEffects<AnyZodObject, unknown, unknown>> (schema: Z): HandlerContextualMiddleware<'params', z.infer<Z>> {
  const middleware: HandlerContextualMiddleware<'params', z.infer<Z>> = (_, context) => {
    try {
      return parseParamsDict(context.params, schema);
    } catch {
      notFound();
    }
  };
  middleware.field = 'params';

  return withDocGen(middleware, () => {
    mutateOperationDoc(operation => {
      operation.request = { ...operation.request, params: schema };
    });
  });
}

export function searchParams<Z extends AnyZodObject | ZodEffects<AnyZodObject, unknown, unknown>> (schema: Z): HandlerContextualMiddleware<'searchParams', z.infer<Z>> {
  const middleware: HandlerContextualMiddleware<'searchParams', z.infer<Z>> = (_, context) => parseParamsDict(context.searchParams ?? {}, schema);
  middleware.field = 'searchParams';

  return withDocGen(middleware, () => {
    mutateOperationDoc(operation => {
      operation.request = { ...operation.request, query: schema };
    });
  });
}

export function stream<T> (decoder: StreamDecoder<T>, accept: string = ContentType.octetStream): HandlerContextualMiddleware<'body', AsyncGenerator<T, undefined>> {
  const middleware: HandlerContextualMiddleware<'body', AsyncGenerator<T, undefined>> = (request) => decodeRequestStream(request, { decoder });
  middleware.field = 'body';

  return withDocGen(middleware, () => {
    mutateOperationDoc(operation => {
      operation.requestBody = {
        content: {
          [accept]: {},
        },
      };
    });
  });
}

export function doc (doc: Pick<RouteConfig, 'description' | 'summary' | 'operationId' | 'tags' | 'externalDocs' | 'deprecated'>) {
  return docGen(() => {
    mutateOperationDoc(operation => {
      Object.assign(operation, doc);
    });
  });
}

export function responseDoc<Z extends ZodType> (status: number, description: string, schema: Z): HandlerMiddleware {
  return docGen(() => {
    mutateOperationDoc(operation => {
      operation.responses = {
        ...operation.responses,
        [String(status)]: {
          description,
          content: {
            'application/json': {
              schema,
            },
          },
        },
      };
    });
  });
}

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

export interface DefineHandlerProps<
  Use extends readonly (HandlerMiddleware | HandlerContextualMiddleware<any, any>)[]
> {
  use?: Readonly<Use>;
  headers?: Record<string, string>;
}

export function defineHandler<
  Use extends Readonly<(HandlerMiddleware | HandlerContextualMiddleware<any, any>)[]>
> (
  { use, headers: initHeaders }: DefineHandlerProps<Use>,
  handle: (data: ResolveMiddlewareData<Use>) => any,
) {
  return wrap(async (request, context) => {
    const isDocGen = isDocGenRequest(request);

    if (isDocGen) {
      startRouteDoc();
    }

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

    if (initHeaders) {
      mutateResponseHeaders(headers => {
        Object.entries(initHeaders).forEach(([k, v]) => headers.set(k, v));
      });
    }

    if (isDocGen) {
      closeRouteDoc(
        request.method.toLowerCase() as any,
        request.nextUrl.pathname
          .replaceAll(encodeURIComponent('{'), '{')
          .replaceAll(encodeURIComponent('}'), '}'),
      );
      return undefined;
    }

    return await handle(data);
  });
}

function isDocGenRequest (request: NextRequest) {
  return request.headers.get('Accept') === 'x-application/api-doc-fragment';
}
