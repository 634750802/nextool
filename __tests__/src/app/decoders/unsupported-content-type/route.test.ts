import { mockAppRouteRequest } from '../../../../../src/testutils';

describe('decodeRequestBody', () => {
  it('must validate content type', async () => {
    const response = await mockAppRouteRequest('/decoders/unsupported-content-type', {
      method: 'POST',
      body: JSON.stringify({
        foo: 'bar',
      }),
      headers: {
        'Content-Type': 'unknown',
      },
    });
    expect(response.status).toEqual(409);
  });
});
