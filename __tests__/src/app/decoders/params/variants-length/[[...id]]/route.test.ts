import { mockAppRouteRequest } from '../../../../../../../src/testutils';

it('should parse params', async () => {
  let response = await mockAppRouteRequest('/decoders/params/variants-length');
  expect(await response.json()).toEqual({ id: [] });

  response = await mockAppRouteRequest('/decoders/params/variants-length/11');
  expect(await response.json()).toEqual({ id: [11] });

  response = await mockAppRouteRequest('/decoders/params/variants-length/11/11');
  expect(await response.json()).toEqual({ id: [11, 11] });
});

it('should 404', async () => {
  const response = await mockAppRouteRequest('/decoders/params/variants-length/1.1');

  expect(response.status).toEqual(404);
});