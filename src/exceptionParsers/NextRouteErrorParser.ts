import { isNextRouterError } from 'next/dist/client/components/is-next-router-error';
import type { RouteExceptionParser } from '../types';

export const NextRouteErrorParser: RouteExceptionParser<unknown> = {
  test: isNextRouterError,
  toResponse: e => Promise.reject(e),
};
