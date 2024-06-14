import type { ZodMediaType } from '@asteasolutions/zod-to-openapi/dist/openapi-registry';
import type { ZodType } from 'zod';
import { docGenOnly, type HandlerMiddleware } from '../defineHandler';
import { mutateOperationDoc } from '../openapi';

export function responseDoc<Z extends ZodType> (status: number, description: string, contentType: ZodMediaType, schema: Z): HandlerMiddleware {
  return docGenOnly(() => {
    mutateOperationDoc(operation => {
      operation.responses = {
        ...operation.responses,
        [String(status)]: {
          description,
          content: {
            [contentType]: {
              schema,
            },
          },
        },
      };
    });
  });
}
