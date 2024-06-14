import { mockAppRouteRequest } from '../../../../../src/testutils';

describe('decodeRequestBody', () => {
  it('must validate content type', async () => {
    const response = await mockAppRouteRequest('/decoders/zod-error', {
      method: 'POST',
      body: JSON.stringify({
        foo: 'bar',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(await response.json())
    expect(response.status).toEqual(422);
  });
});
