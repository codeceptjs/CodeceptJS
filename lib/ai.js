const { Configuration, OpenAIApi } = require('openai');
const debug = require('debug')('codeceptjs:ai');
const config = require('./config');
const output = require('./output');
const { removeNonInteractiveElements, minifyHtml, splitByChunks } = require('./html');

const defaultConfig = {
  model: 'gpt-3.5-turbo-16k',
  temperature: 0.1,
}

const htmlConfig = {
  maxLength: null,
  simplify: true,
  minify: true,
  interactiveElements: ['a', 'input', 'button', 'select', 'textarea', 'option'],
  textElements: ['label', 'h1', 'h2'],
  allowedAttrs: ['id', 'for', 'class', 'name', 'type', 'value', 'aria-labelledby', 'aria-label', 'label', 'placeholder', 'title', 'alt', 'src', 'role'],
  allowedRoles: ['button', 'checkbox', 'search', 'textbox', 'tab'],  
}

class AiAssistant {

  constructor() {
    this.config = config.get('openai', defaultConfig);
    this.htmlConfig = this.config.html || htmlConfig;
    delete this.config.html;
    this.html = null;
    this.response = null;
    
    this.isEnabled = !!process.env.OPENAI_API_KEY;
    
    if (!this.isEnabled) return;
    
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
  
    this.openai = new OpenAIApi(configuration);
  }

  setHtmlContext(html) {
    let processedHTML = html;

    if (this.htmlConfig.simplify) processedHTML = removeNonInteractiveElements(processedHTML, {
      interactiveElements: this.htmlConfig.interactiveElements,
      allowedAttrs: this.htmlConfig.allowedAttrs,
      allowedRoles: this.htmlConfig.allowedRoles,
    });
    if (this.htmlConfig.minify) processedHTML = minifyHtml(processedHTML);
    if (this.htmlConfig.maxLength) processedHTML = splitByChunks(processedHTML, this.htmlConfig.maxLength)[0];
    
    debug(processedHTML);

    this.html = processedHTML;
  }

  getResponse() {
    return this.response || '';
  }

  mockResponse(response) {
    this.mockedResponse = response;
  }

  async createCompletion(messages) {
    if (!this.openai) return;

    debug(messages)

    if (this.mockedResponse) return this.mockedResponse;

    this.response = null;

    try {
      const completion = await this.openai.createChatCompletion({
        ...this.config,
        messages,
      });

      this.response = completion?.data?.choices[0]?.message?.content;

      debug(this.response);

      return this.response;
    } catch (err) {
      debug(err.response);
      output.print('');
      output.error(`OpenAI error: ${err.message}`);
      output.error(err?.response?.data?.error?.code);
      output.error(err?.response?.data?.error?.message);
      return '';
    }
  }

  async healFailedStep(step, err, test) {
    if (!this.isEnabled) return [];
    if (!this.html) throw new Error('No HTML context provided');

    const messages = [
      { role: 'user', content: 'As a test automation engineer I am testing web application using CodeceptJS.' },
      { role: 'user', content: `I want to heal a test that fails. Here is the list of executed steps: ${test.steps.join(', ')}` },
      { role: 'user', content: `Propose how to adjust ${step.toCode()} step to fix the test.` },
      { role: 'user', content: 'Use locators in order of preference: semantic locator by text, CSS, XPath. Use codeblocks marked with ```.' },
      { role: 'user', content: `Here is the error message: ${err.message}` },
      { role: 'user', content: `Here is HTML code of a page where the failure has happened: \n\n${this.html}` },
    ];

    const response = await this.createCompletion(messages);
    if (!response) return [];

    return parseCodeBlocks(response);
  }

  async writeSteps(input) {
    if (!this.isEnabled) return;
    if (!this.html) throw new Error('No HTML context provided');

    const snippets = [];

    const messages = [
      { role: 'user',           
        content: `I am test engineer writing test in CodeceptJS
          I have opened web page and I want to use CodeceptJS to ${input} on this page
          Provide me valid CodeceptJS code to accomplish it
          Use only locators from this HTML: \n\n${this.html}` },
      { role: 'user', content: `Propose only CodeceptJS steps code. Do not include Scenario or Feature into response` },

      // old prompt
      // { role: 'user', content: 'I want to click button Submit using CodeceptJS on this HTML page: <html><body><button>Submit</button></body></html>' },        
      // { role: 'assistant', content: '```js\nI.click("Submit");\n```' },
      // { role: 'user', content: 'I want to click button Submit using CodeceptJS on this HTML page: <html><body><button>Login</button></body></html>' },        
      // { role: 'assistant', content: 'No suggestions' },        
      // { role: 'user', content: `Now I want to ${input} on this HTML page using CodeceptJS code` },
      // { role: 'user', content: `Provide me with CodeceptJS code to achieve this on THIS page.` },
    ];
    const response = await this.createCompletion(messages);
    if (!response) return;
    snippets.push(...parseCodeBlocks(response));

    debug(snippets[0]);

    return snippets[0];
  }
}

class DummyAi extends AiAssistant {

  constructor() {
    super();
    this.isEnabled = true;
  }

  setResponse(response) {
    this.response = response;
    return this;
  }

  async createCompletion(messages) {
    debug(messages);
    return this.response || 'Dummy AI response';
  }
}

function parseCodeBlocks(response) {
  // Regular expression pattern to match code snippets
  const codeSnippetPattern = /```(?:javascript|js|typescript|ts)?\n([\s\S]+?)\n```/g;

  // Array to store extracted code snippets
  const codeSnippets = [];

  // Iterate over matches and extract code snippets
  let match;
  while ((match = codeSnippetPattern.exec(response)) !== null) {
    codeSnippets.push(match[1]);
  }

  // Remove "Scenario", "Feature", and "require()" lines
  const modifiedSnippets = codeSnippets.map(snippet => {
    const lines = snippet.split('\n').map(line => line.trim());
  
    const filteredLines = lines.filter(line => !line.includes('I.amOnPage') && !line.startsWith('Scenario') && !line.startsWith('Feature') && !line.includes('= require('));
  
    return filteredLines.join('\n');
    // remove snippets that move from current url
  }); // .filter(snippet => !line.includes('I.amOnPage'));  

  return modifiedSnippets.filter(snippet => !!snippet);  
}

module.exports = AiAssistant;
AiAssistant.DummyAi = DummyAi;