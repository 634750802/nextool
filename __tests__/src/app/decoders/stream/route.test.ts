import { ContentType } from '../../../../../src/decoders/decodeRequestBody';
import { mockAppRouteRequest } from '../../../../../src/testutils';

describe('decodeRequestStream', () => {
  it('generate chunks', async () => {
    const encoder = new TextEncoder();
    const response = await mockAppRouteRequest('/decoders/stream', {
      method: 'POST',
      body: new ReadableStream({
        start (controller) {
          controller.enqueue(encoder.encode('hello'));
          controller.enqueue(encoder.encode('world'));
          controller.close();
        },
      }),
      headers: {
        'Content-Type': ContentType.octetStream,
      },
    });
    expect(await response.json()).toEqual(['hello', 'world']);
  });
});
