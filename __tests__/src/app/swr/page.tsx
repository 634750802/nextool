'use client';

import useSWR from 'swr';
import { ZodErrorParser } from '../../../../src/clientErrorParsers/zodErrorParser';
import { createClientHandleErrors } from '../../../../src/createClientHandleErrors';
import { createSimpleSWRGetHook, createSWRFetcher } from '../../../../src/swr/createSWRFetcher';

const handleErrors = createClientHandleErrors([
  ZodErrorParser,
]);

const fetcher = createSWRFetcher(handleErrors, response => response.json());
const useGet = createSimpleSWRGetHook(handleErrors);

export default function Page () {
  const { data, isLoading } = useSWR(['get', '/swr/data'], fetcher<{ foo: string }>, { dedupingInterval: 500 });
  const { data: data2, isLoading: isLoading2 } = useGet<{ foo: string }>('/swr/data', undefined, { dedupingInterval: 500 });

  return (
    <div>
      <div>
        {isLoading ? 'loading' : 'loaded'}: {data?.foo}
      </div>
      <div>
        {isLoading2 ? 'loading' : 'loaded'}: {data2?.foo}
      </div>
    </div>
  );
}
