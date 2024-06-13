import { z } from 'zod';
import { body, defineHandler } from '../../../../../src/defineHandler';
import { fileType } from '../../../../../src/schema/fileType';

export const POST = defineHandler({
  use: [
    body(z.object({
      name: z.string(),
      file: fileType,
    })),
  ],
}, ({ body }) => {
  return body.name;
});
