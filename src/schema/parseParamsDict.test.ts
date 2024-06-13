import { describe } from 'node:test';
import { z } from 'zod';
import { parseParamsDict } from './parseParamsDict';

describe('parseParamsDict', () => {
  it('should pass', () => {
    const schema = z.object({
      string: z.string(),
      string_array: z.string().array(),
      optional_string: z.string().optional(),
      optional_string_array: z.string().array().optional(),
      int: z.coerce.number().int(),
    });

    expect(parseParamsDict({
      string: 'a',
      string_array: 'b',
      int: '3',
    }, schema)).toEqual({
      string: 'a',
      string_array: ['b'],
      int: 3,
      optional_string: undefined,
      optional_string_array: [],
    });
  });
});