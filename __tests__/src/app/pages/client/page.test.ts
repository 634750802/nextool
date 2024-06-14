import { mockAppRoutePage } from '../../../../../src/testutils';

it('should support next/navigation hooks', async () => {
  const rendered = await mockAppRoutePage('/pages/client?a=1');
  expect(rendered.container.innerHTML).toEqual('/pages/client a=1');
});
