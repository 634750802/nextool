import { ZodError } from 'zod';
import type { RouteExceptionParser } from '../types';

export const ZodErrorParser: RouteExceptionParser<ZodError> = {
  test: target => target instanceof ZodError,
  toResponse: target => {

    return Response.json({
      message: 'Validation failed',
      type: 'ZodError',
      detail: {
        issues: target.issues,
      },
    }, {
      status: 422,
    });
  },
};
