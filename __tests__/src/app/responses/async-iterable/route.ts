import { defineHandler } from '../../../../../src/defineHandler';
import { streamResponse } from '../../../../../src/middlewares/streamResponse';

export const GET = defineHandler({
  use: [
    streamResponse('text/any-stream', new TextEncoder()),
  ],
}, async function* () {
  yield 'hello';
  yield ', ';
  yield 'world';
  yield '!';
});
