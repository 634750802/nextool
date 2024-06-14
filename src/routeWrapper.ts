import type { NextRequest } from 'next/server';
import { type ParamsDict, type RequestContext, type RouteExceptionParser, type RouteHandler, type RouteResponseParser } from './types';

export type RouteWrapper<P extends ParamsDict, S extends ParamsDict> = (
  request: NextRequest,
  context: RequestContext<P, S>,
) => any

export interface RouteWrapperOptions {
  responseParsers: RouteResponseParser<any>[];
  exceptionParsers: RouteExceptionParser<any>[];
  responseHeadersMutations: ((headers: Headers) => void)[];
}

export function wrap<P extends ParamsDict, S extends ParamsDict> (
  handler: RouteWrapper<P, S>,
  {
    responseParsers,
    responseHeadersMutations,
    exceptionParsers,
  }: RouteWrapperOptions,
): RouteHandler {
  return async (request, context) => {
    try {
      const response = await handler(request, context as RequestContext<P, S>);
      try {
        for (let handler of responseParsers) {
          if (handler.test(response)) {
            return handler.toResponse(response, responseHeadersMutations);
          }
        }
        return returnToResponse(response, responseHeadersMutations);
      } catch (e) {
        console.error('Error occurs in response parser');
        return new Response('Error occurs in handler response parser.', { status: 500 });
      }
    } catch (exception) {
      try {
        for (let handler of exceptionParsers) {
          if (handler.test(exception)) {
            return handler.toResponse(exception);
          }
        }
        return handleUnknownException(exception);
      } catch (e) {
        console.error(exception);
        console.error('Error occurs in exception parser', e);
        return new Response('Error occurs in handler exception parser.', { status: 500 });
      }
    }
  };
}

function returnToResponse (value: unknown, mutateHeaders: ((headers: Headers) => void)[]): Response {
  const headers = new Headers();
  mutateHeaders.forEach(mutate => mutate(headers));

  if (value == null) {
    return new Response(undefined, { headers });
  }

  const mime = headers.get('Content-Type');
  // If content type was set to text/*, return the value directly.
  if (mime && /^text\//.test(mime)) {
    const body = isBodyInit(value) ? value : String(value);
    return new Response(body, { headers });
  }
  return Response.json(value, { headers });
}

function isBodyInit (value: unknown): value is BodyInit {
  if (typeof value === 'string') {
    return true;
  }
  if (typeof value === 'object') {
    for (let cls of [Blob, ReadableStream, ArrayBuffer, DataView, Buffer, Uint8Array]) {
      if (value instanceof cls) {
        return true;
      }
    }
  }

  return false;
}

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
