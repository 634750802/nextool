import { ZodError, type ZodIssue } from 'zod';
import type { ClientFetchErrorParser } from './type';

export const ZodErrorParser: ClientFetchErrorParser<{
  name: 'ZodError',
  message: string,
  detail: {
    issues: ZodIssue[]
  }
}, ZodError> = {
  test (json) {
    return json && typeof json === 'object' && json.name === 'ZodError';
  },
  toLocalError (json) {
    return ZodError.create(json.detail.issues);
  },
};
