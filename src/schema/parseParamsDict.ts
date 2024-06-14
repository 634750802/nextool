import * as z from 'zod';
import type { ParamsDict } from '../types';
import { isArrayType } from './isArrayType';

export function parseParamsDict<Z extends z.ZodType> (dict: ParamsDict, schema: Z): z.infer<Z> {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Schema cannot be parsed. Only support z.object for params dict.');
  }
  let raw: any = { ...dict };
  for (const key in schema.shape) {
    if (schema.shape.hasOwnProperty(key)) {
      const fieldSchema = schema.shape[key];
      if (isArrayType(fieldSchema)) {
        raw[key] = dict[key] == null ? [] : typeof dict[key] === 'string' ? [dict[key]] : dict[key];
      } else {
        raw[key] = dict[key];
      }
    }
  }
  return schema.parse(raw);
}
