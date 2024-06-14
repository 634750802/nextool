import { z } from 'zod';
import { body, defineHandler } from '../../../../../src/defineHandler';

export const POST = defineHandler({
  use: [
    body(z.object({
      foo: z.number(),
    })),
  ],
}, ({ body }) => {
  return body;
});
