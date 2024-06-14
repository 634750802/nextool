import { defineHandler } from '../../../../../src/defineHandler';

export const GET = defineHandler({}, async () => {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 1000);
  });
  return { foo: 'bar' };
});
