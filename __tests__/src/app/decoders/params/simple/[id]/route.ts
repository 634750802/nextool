import { z } from 'zod';
import { defineHandler, doc, params, responseDoc, searchParams } from '../../../../../../../src/defineHandler';

const idParam = z.string().transform(e => parseInt(e)).openapi('PathID');

export const GET = defineHandler({
  use: [
    doc({
      summary: 'Get With Simple Params',
      description: 'This route handle shows how nextool handles request params with zod',
      operationId: 'getWithSimpleParams',
      tags: ['DocTest'],
    }),
    responseDoc(200, 'Just good response', z.object({
      id: z.number(),
    })),
    params(z.object({
      id: idParam,
    })),
    searchParams(z.object({
      id: idParam.optional(),
    })),
  ],
}, ({ params }) => {
  return params;
});
