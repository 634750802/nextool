import { mockAppRouteLayout } from '../../../../../src/testutils';

it('should pass', async () => {
  const rendered = await mockAppRouteLayout('/layouts/rsc', <span></span>);

  expect(rendered.container.innerHTML).toBe('<div><span></span></div>')
});
