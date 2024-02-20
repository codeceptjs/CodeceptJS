import AiAssistant from '../../lib/ai.js';
import config from '../../lib/config.js';

import { expect } from 'chai';

describe('AI module', () => {
  beforeEach(() => config.reset());

  it('should be externally configurable', async () => {
    const html = '<div><a data-qa="ok">Hey</a></div>';
    const ai = new AiAssistant();
    await ai.setHtmlContext(html);
    expect(ai.html).to.include('<a>Hey</a>');

    config.create({
      ai: {
        html: {
          allowedAttrs: ['data-qa'],
        },
      },
    });

    const ai2 = new AiAssistant();
    await ai2.setHtmlContext(html);
    expect(ai2.html).to.include('<a data-qa="ok">Hey</a>');
  });
});
