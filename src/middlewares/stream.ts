import { ContentType } from '../decoders/decodeRequestBody';
import { decodeRequestStream, type StreamDecoder } from '../decoders/decodeRequestStream';
import { type HandlerContextualMiddleware, withDocGen } from '../defineHandler';
import { mutateOperationDoc } from '../openapi';

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