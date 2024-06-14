import { mockAppRoutePage } from '../../../../../src/testutils';
import '@testing-library/jest-dom';

it('support one level async server component', async () => {
  const rendered = await mockAppRoutePage('/pages/rsc');

  expect(rendered.baseElement.textContent).toBe('done');
});
