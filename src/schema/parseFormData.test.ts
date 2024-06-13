import { describe } from 'node:test';
import { z } from 'zod';
import { fileType } from './fileType';
import { parseFormData } from './parseFormData';

describe('parseFormData', () => {
  it('should pass', () => {
    const file = new File([], 'file1');
    const form = new FormData();
    form.set('string', 'string');
    form.set('int', '42');
    form.set('file', file);
    form.append('array', 'item1');
    form.append('array', 'item2');
    expect(parseFormData(form, z.object({
      string: z.string(),
      int: z.coerce.number().int(),
      file: fileType,
      array: z.string().array(),
    }))).toEqual({
      string: 'string',
      int: 42,
      file,
      array: ['item1', 'item2']
    });
  });
});