import { z } from 'zod';
import { defineHandler, params } from '../../../../../../../src/defineHandler';

export const GET = defineHandler({
  use: [
    params(z.object({
      id: z.coerce.number().int().array().optional(),
    })),
  ],
}, async ({ params }) => {
  return params;
});
