import type { ClientFetchErrorParser } from './clientErrorParsers/type';

export type HandleErrors = (response: Promise<Response> | Response) => Promise<Response>;

export function createClientHandleErrors (
  errorParsers: ClientFetchErrorParser<any, any>[],
): HandleErrors {
  return async responsePromise => {
    const response = await responsePromise;
    if (response.ok) {
      return response;
    }

    try {
      const data = await response.clone().json();

      try {
        for (let errorParser of errorParsers) {
          if (errorParser.test(data)) {
            return Promise.reject(errorParser.toLocalError(data));
          }
        }

        if ('message' in data) {
          return Promise.reject(new Error(`${String(data.message)}`));
        } else {
          return Promise.reject(new Error(`${response.status} ${JSON.stringify(data)}`));
        }
      } catch (error) {
        console.error('Error in client fetch error parser', error);
        return Promise.reject(new Error(`${response.status} ${response.statusText}`));
      }
    } catch {
      // failed to parse response as json;
      const text = await response.clone().text();
      return Promise.reject(new Error(`${response.status} ${text || response.statusText}`));
    }
  };
}