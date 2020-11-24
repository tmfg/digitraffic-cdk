import {handler} from "../../../../lib/lambda/es-key-figures/collect-key-figures";

describe('collect-key-figures', () => {
  test('simple run', async () => {
    const latest = await handler();

    expect(latest).toBe('abc');
  });

});
