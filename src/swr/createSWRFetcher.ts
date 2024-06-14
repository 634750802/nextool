import useSWR, { type SWRConfiguration } from 'swr';
import type { HandleErrors } from '../createClientHandleErrors';

type ItemOrArray<T> = T | T[]
type SearchParams = Record<string, ItemOrArray<string | number | boolean | null | undefined>>

export function createSWRFetcher (handleErrors: HandleErrors, decode: (response: Response) => Promise<any>) {
  return function <T> ([method, base, searchParams, requestInit]: readonly [string, string, _?: SearchParams | URLSearchParams, _?: Omit<RequestInit, 'method'>]): Promise<T> {
    return fetch(buildUrl(base, searchParams), { ...requestInit, method })
      .then(handleErrors)
      .then(decode);
  };
}

export function createSimpleSWRGetHook (handleErrors: HandleErrors) {
  const fetcher = createSWRFetcher(handleErrors, response => response.json());
  return function useSWRFetch<T> (base: string, params?: SearchParams | URLSearchParams, config?: Omit<SWRConfiguration, 'fetcher'>) {
    return useSWR(params === undefined ? ['get', base] : ['get', base, params], fetcher<T>, config);
  };
}

function buildUrl (base: string, searchParams: SearchParams | URLSearchParams | undefined) {
  const usp = buildSearchParams(searchParams);
  if (Array.from(usp.keys()).length > 0) {
    const questionMarkIndex = base.indexOf('?');
    if (questionMarkIndex === -1) {
      return base + '?' + usp.toString();
    } else if (questionMarkIndex === base.length - 1 || base.endsWith('&')) {
      return base + usp.toString();
    } else {
      return base + '&' + usp.toString();
    }
  } else {
    return base;
  }
}

function buildSearchParams (sp: SearchParams | URLSearchParams | undefined) {
  if (sp instanceof URLSearchParams) {
    return sp;
  }
  const usp = new URLSearchParams();
  if (!sp) {
    return usp;
  }
  Object.entries(sp).forEach(([key, value]) => {
    if (value != null) {
      if (value instanceof Array) {
        value.forEach(item => usp.append(key, String(item)));
      } else {
        usp.set(key, String(value));
      }
    }
  });

  return usp;
}
