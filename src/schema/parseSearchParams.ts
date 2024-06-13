import { z } from 'zod';
import { isArrayType } from './isArrayType';

export function parseURLSearchParams<Z extends z.ZodType> (usp: URLSearchParams, schema: Z): z.infer<Z> {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Schema cannot be parsed. Only support z.object for params dict.');
  }
  const keySet = new Set(usp.keys());
  let raw: any = {};
  for (const key in schema.shape) {
    if (schema.shape.hasOwnProperty(key)) {
      const fieldSchema = schema.shape[key];
      if (isArrayType(fieldSchema)) {
        raw[key] = usp.getAll(key);
      } else {
        raw[key] = usp.get(key) ?? undefined;
      }
      keySet.delete(key);
    }
  }
  keySet.forEach(key => {
    const value = usp.getAll(key);

    if (value.length === 0) {
      raw[key] = undefined;
    } else if (value.length === 1) {
      raw[key] = value[0];
    } else {
      raw[key] = value;
    }
  });

  return schema.parse(raw);
}