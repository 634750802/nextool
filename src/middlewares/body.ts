import { z, type ZodType } from 'zod';
import { ContentType, decodeRequestBody } from '../decoders/decodeRequestBody';
import { type HandlerContextualMiddleware, withDocGen } from '../defineHandler';
import { mutateOperationDoc } from '../openapi';

export function body<Z extends ZodType> (schema: Z): HandlerContextualMiddleware<'body', z.infer<Z>> {
  const middleware: HandlerContextualMiddleware<'body', z.infer<Z>> = (request) => decodeRequestBody(request, schema, { accept: [ContentType.json, ContentType.multipart] });
  middleware.field = 'body';

  return withDocGen(middleware, () => {
    mutateOperationDoc(operation => {
      operation.request = { ...operation.request, body: { content: { 'application/json': { schema } } } };
    });
  });
}