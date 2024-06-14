import { ContentType } from '../decoders/decodeRequestBody';
import type { RouteResponseParser, RouteStreamEncoder } from '../types';
import { isAsyncIterable } from '../utils';

export const StreamResponseParser = <T> (encoder: RouteStreamEncoder<T>): RouteResponseParser<AsyncIterable<T>> => ({
  test: isAsyncIterable,
  toResponse: (asyncIterable, mutateHeaders) => {
    const headers = new Headers();
    mutateHeaders.forEach(mutate => mutate(headers));

    headers.set('Content-Type', headers.get('Content-Type') ?? ContentType.octetStream);
    headers.set('X-Content-Type-Options', headers.get('X-Content-Type-Options') ?? 'nosniff');

    return new Response(new ReadableStream({
      start: async controller => {
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
});
