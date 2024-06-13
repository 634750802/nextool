import { describe } from 'node:test';
import { z } from 'zod';
import { parseURLSearchParams } from './parseSearchParams';

describe('parseSearchParams', () => {
  it('should pass', () => {
    const schema = z.object({
      string: z.string(),
      string_array: z.string().array(),
      optional_string: z.string().optional(),
      optional_string_array: z.string().array().optional(),
      int: z.coerce.number().int(),
    });

    expect(parseURLSearchParams(new URLSearchParams(`string=a&string_array=b&int=3`), schema)).toEqual({
      string: 'a',
      string_array: ['b'],
      int: 3,
      optional_string: undefined,
      optional_string_array: [],
    });

    expect(parseURLSearchParams(new URLSearchParams(`string=a&int=3&optional_string_array=a&optional_string_array=b`), schema)).toEqual({
      string: 'a',
      string_array: [],
      int: 3,
      optional_string: undefined,
      optional_string_array: ['a', 'b'],
    });
  });
});