import { type HandlerMiddleware, withDocGen } from '../defineHandler';
import { mutateOperationDoc } from '../openapi';
import { StreamResponseParser } from '../responseParsers/StreamResponseParser';
import type { RouteStreamEncoder } from '../types';

export function streamResponse<T> (
  contentType: string,
  encoder: RouteStreamEncoder<T>,
  description: string = 'Streamed response',
) {
  const middleware: HandlerMiddleware<AsyncGenerator<T, void>> = () => {};
  middleware.addResponseParsers = [StreamResponseParser(encoder)];
  middleware.mutateResponseHeaders = headers => {
    headers.set('Content-Type', contentType);
  };

  return withDocGen(middleware, () => {
    mutateOperationDoc(doc => {
      doc.responses = {
        ...doc.responses,

        '200': {
          description,
          content: {
            [contentType]: {
              schema: {
                description: 'Some binary stream protocol',
              },
            },
          },
        },
      };
    });
  });
}