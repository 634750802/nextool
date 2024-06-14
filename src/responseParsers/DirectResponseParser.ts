import type { RouteResponseParser } from '../types';

export const DirectResponseParser: RouteResponseParser<Response> = {
  test: e => e instanceof Response,
  toResponse: (response, mutateHeaders) => {
    mutateHeaders.forEach(mutate => mutate(response.headers));
    return response;
  },
};