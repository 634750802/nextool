import { describe } from 'node:test';
import { mockAppRoutePage } from '../../../../src/testutils';

describe('Page', () => {
  it('test page', async () => {
    const rendered = await mockAppRoutePage('/swr');
    expect(rendered.container.innerHTML).toBe('<div><div>not loading: </div><div>not loading: </div></div>');
  });
});
