import { z } from 'zod';
import { body, defineHandler } from '../../../../../src/defineHandler';

export const POST = defineHandler({
  use: [
    body(z.object({}).passthrough()),
  ],
}, ({ body }) => {
  return body;
});
