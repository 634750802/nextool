import { describe } from 'node:test';
import { z } from 'zod';
import { isArrayType } from './isArrayType';

describe('isArrayType', () => {
  it('should pass', () => {
    expect(isArrayType(z.number().array())).toBe(true);
    expect(isArrayType(z.number().array().optional())).toBe(true);
    expect(isArrayType(z.number().array().nullish())).toBe(true);
    expect(isArrayType(z.number().array().default([]))).toBe(true);
    expect(isArrayType(z.number().array().transform(a => a[0]))).toBe(true);
    expect(isArrayType(z.number().array().refine(a => a[0]))).toBe(true);
    expect(isArrayType(z.number().int())).toBe(false);
  });
});
