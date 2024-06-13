import type { NextRequest } from 'next/server';
import { ContentType, matchContentType } from './decodeRequestBody';

export interface StreamDecoder<T> {
  decode: (chunk: Uint8Array) => T;
}

export function decodeRequestStream (request: NextRequest): AsyncGenerator<Uint8Array, undefined>
export function decodeRequestStream (request: NextRequest, _: { cloneStream?: boolean, decoder?: undefined }): AsyncGenerator<Uint8Array, undefined>
export function decodeRequestStream<T> (request: NextRequest, _: { cloneStream?: boolean, decoder: StreamDecoder<T> }): AsyncGenerator<T, undefined>
export async function* decodeRequestStream<T = void> (
  request: NextRequest,
  {
    cloneStream = false,
    decoder,
  }: {
    cloneStream?: boolean,
    decoder?: StreamDecoder<T>
  } = {},
): any {

  if (!matchContentType(request, ContentType.octetStream)) {
    throw new Response(null, { status: 409 });
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new Error('Cannot decode stream');
  }

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    if (decoder) {
      yield decoder.decode(chunk.value) as any;
    } else {
      yield chunk.value as any;
    }
  }
}

export function textDecoder () {
  const decoder = new TextDecoder();
  return {
    decode: (chunk: Uint8Array) => decoder.decode(chunk, { stream: true }),
  };
}