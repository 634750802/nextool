import * as z from 'zod';
import { ZodEffects } from 'zod';

export function isArrayType (schema: z.ZodType) {
  if (schema instanceof z.ZodArray) {
    return true;
  }
  if ('innerType' in schema._def) {
    return isArrayType(schema._def.innerType as any);
  }

  if (schema instanceof ZodEffects) {
    return isArrayType(schema.innerType());
  }
  return false;
}
