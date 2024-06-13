import { mockAppRouteRequest } from '../../../../../src/testutils';

it('should handle async iterable', async () => {
  const response = await mockAppRouteRequest('/responses/async-iterable');

  expect(response.headers.get('content-type')).toEqual('text/any-stream');
  expect(await response.text()).toEqual('hello, world!');
});
