import { mockAppRouteRequest } from '../../../../../../../src/testutils';

it('should parse params', async () => {
  const response = await mockAppRouteRequest('/decoders/params/simple/11');

  expect(await response.json()).toEqual({ id: 11 });
});

it('should 404', async () => {
  const response = await mockAppRouteRequest('/decoders/params/simple/1.1');

  expect(response.status).toEqual(404);
});