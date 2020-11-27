import {handler} from "../../../lib/lambda/collect-es-key-figures";

describe('collect-es-key-figures', () => {

  test('isLambdaLifecycleEvent true', async () => {
    jest.setTimeout(300000);
    await handler();
  });

});
