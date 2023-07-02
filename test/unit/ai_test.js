const { expect } = require('chai');
const AiAssistant = require('../../lib/ai');
const config = require('../../lib/config');

describe('AI module', () => {
  beforeEach(() => config.reset());

  it('should be externally configurable', () => {
    const html = '<div><a data-qa="ok">Hey</a></div>';
    const ai = new AiAssistant();
    ai.setHtmlContext(html);
    expect(ai.html).to.include('<a>Hey</a>');

    config.create({
      ai: {
        html: {
          allowedAttrs: ['data-qa'],
        },
      },
    });

    const ai2 = new AiAssistant();
    ai2.setHtmlContext(html);
    expect(ai2.html).to.include('<a data-qa="ok">Hey</a>');
  });
});
