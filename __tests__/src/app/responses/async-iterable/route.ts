import { defineHandler } from '../../../../../src/defineHandler';

export const GET = defineHandler({
  headers: {
    'Content-Type': 'text/any-stream',
  },
}, async function* () {
  yield 'hello';
  yield ', ';
  yield 'world';
  yield '!';
});
