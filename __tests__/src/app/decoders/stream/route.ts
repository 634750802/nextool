import { textDecoder } from '../../../../../src/decoders/decodeRequestStream';
import { defineHandler, stream } from '../../../../../src/defineHandler';

export const POST = defineHandler({
  use: [
    stream(textDecoder()),
  ],
}, async ({ body }) => {
  const parts: string[] = [];

  for await (let chunk of body) {
    parts.push(chunk);
  }

  return parts;
});
