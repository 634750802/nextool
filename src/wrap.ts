import { isNextRouterError } from 'next/dist/client/components/is-next-router-error';
import type { NextRequest } from 'next/server';
import { ContentType } from './decoders/decodeRequestBody';
import { type ParamsDict, requestAsyncLocalStorage, type RequestContext, requestStore, responseStreamEncoder, type RouteHandler, type RouteResponseParser } from './requestAsyncLocalStorage';
import { isAsyncIterable } from './utils';

export type Wrap<P extends ParamsDict, S extends ParamsDict> = (
  request: NextRequest,
  context: RequestContext<P, S>,
) => any

export function wrap<P extends ParamsDict, S extends ParamsDict> (handler: Wrap<P, S>): RouteHandler {
  return async (request, context) => {
    const responseHeadersMutations: ((header: Headers) => void)[] = [];
    const responseHandlers: RouteResponseParser<any>[] = [
      DirectResponseAsResponse,
      StreamAsResponse,
    ];
    const exceptionHandlers: RouteResponseParser<any> [] = [
      DirectResponseAsError,
      NextRouteAsError,
    ];
    return await requestAsyncLocalStorage.run({
      responseHeadersMutations,
      responseHandlers,
      exceptionHandlers,
    }, async () => {
      try {
        const response = await handler(request, context as RequestContext<P, S>);
        for (let handler of responseHandlers) {
          if (handler.test(response)) {
            return handler.toResponse(response);
          }
        }
        return returnToResponse(response);
      } catch (exception) {
        for (let handler of exceptionHandlers) {
          if (handler.test(exception)) {
            return handler.toResponse(exception);
          }
        }
        return handleUnknownException(exception);
      }
    });
  };
}

function returnToResponse (value: unknown): Response {
  const headers = new Headers();
  requestStore().responseHeadersMutations.forEach(mutation => {
    mutation(headers);
  });

  if (value == null) {
    return new Response(undefined, { headers });
  }

  return Response.json(value, { headers });
}

const DirectResponseAsResponse: RouteResponseParser<Response> = {
  test: e => e instanceof Response,
  toResponse: response => {
    requestStore().responseHeadersMutations.forEach(mutation => mutation(response.headers));
    return response;
  },
};

const StreamAsResponse: RouteResponseParser<AsyncIterable<any>> = {
  test: isAsyncIterable,
  toResponse: asyncIterable => {
    const headers = new Headers();
    requestStore().responseHeadersMutations.forEach(mutation => mutation(headers));

    headers.set('Content-Type', headers.get('Content-Type') ?? ContentType.octetStream);
    headers.set('X-Content-Type-Options', headers.get('X-Content-Type-Options') ?? 'nosniff');

    return new Response(new ReadableStream({
      start: async controller => {
        const encoder = responseStreamEncoder() ?? new TextEncoder();
        try {
          for await (const chunk of asyncIterable) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    }), {
      headers,
    });
  },
};

const DirectResponseAsError: RouteResponseParser<Response> = {
  test: e => e instanceof Response,
  toResponse: e => e,
};

const NextRouteAsError: RouteResponseParser<unknown> = {
  test: isNextRouterError,
  toResponse: e => Promise.reject(e),
};

function handleUnknownException (exception: unknown): Response {
  if (exception instanceof Error) {
    console.error('Unhandled exception', exception);
    return Response.json({
      name: exception.name,
      message: exception.message,
    }, { status: 500 });
  }
  console.error('Unknown type of exception', exception);
  return Response.json({
    message: 'Unknown type of exception',
  }, { status: 500 });
}
