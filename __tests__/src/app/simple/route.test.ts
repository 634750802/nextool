import { mockAppRouteRequest } from '../../../../src/testutils';

describe('routes', () => {
  it('GET', async () => {
    const response = await mockAppRouteRequest('/simple');
    expect(response.status).toBe(200);
  });

  it('POST', async () => {
    const response = await mockAppRouteRequest('/simple', {
      method: 'POST',
      body: JSON.stringify({
        foo: 'bar',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(await response.json()).toEqual({
      foo: 'bar',
    });
  });
});
