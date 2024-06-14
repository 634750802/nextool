import type { RouteExceptionParser } from '../types';

export const ResponseErrorParser: RouteExceptionParser<Response> = {
  test: e => e instanceof Response,
  toResponse: (e) => e,
};
