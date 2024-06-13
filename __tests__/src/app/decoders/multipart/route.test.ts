import { mockAppRouteRequest } from '../../../../../src/testutils';

it('should pass', async () => {
  const form = new FormData();
  form.set('name', 'name');
  form.set('file', new File([], 'filename'))
  const response = await mockAppRouteRequest('/decoders/multipart', {
    method: 'POST',
    body: form
  });

  expect(response.status).toEqual(200);
  expect(await response.json()).toEqual('name');
})