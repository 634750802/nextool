import { z, ZodEffects } from 'zod';

export const fileType = z.custom<File>(data =>
    data instanceof File,
  {
    message: 'Not a file',
    fatal: true,
  },
);

export function isFileType (schema: z.ZodType) {
  if (schema === fileType) {
    return true;
  }
  if ('innerType' in schema._def) {
    return isFileType(schema._def.innerType as any);
  }

  if (schema instanceof ZodEffects) {
    return isFileType(schema.innerType());
  }
  return false;
}
