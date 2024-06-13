import { z } from 'zod';

export const CreateUser = z.object({
  name: z.string(),
});
