export function createMockModel(config = {}) {
  const { responses = [{ text: 'Mock AI response' }], simulateError = false, errorType = 'api', delay = 0 } = config

  let callCount = 0

  const mockModel = {
    specificationVersion: 'v3',
    modelId: 'mock-model',
    provider: 'mock',
    defaultObjectGenerationMode: 'json',

    async doGenerate(options) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      if (simulateError) {
        throw new Error(`Mock ${errorType} error`)
      }

      const response = responses[callCount] || responses[responses.length - 1]
      callCount++

      const textContent = response.text || 'Mock response'

      // Calculate token values
      const promptTokens = response.promptTokens || 50
      const totalTokens = response.totalTokens || 100
      const completionTokens = response.completionTokens || (totalTokens - promptTokens)

      return {
        text: textContent,
        content: [
          {
            type: 'text',
            text: textContent,
          },
        ],
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          inputTokens: {
            total: promptTokens,
          },
          outputTokens: {
            total: completionTokens,
          },
        },
        finishReason: response.finishReason || 'stop',
        rawResponse: {
          headers: {},
        },
        warnings: [],
        logprobs: undefined,
        response: {
          id: `mock-${Date.now()}`,
          timestamp: new Date(),
          modelId: 'mock-model',
        },
        rawCall: {
          rawPrompt: options.prompt,
          rawSettings: {},
        },
        request: {
          body: JSON.stringify({ messages: options.prompt }),
        },
        experimental_providerMetadata: undefined,
      }
    },

    // Utility methods for testing
    _reset() {
      callCount = 0
    },

    _getCallCount() {
      return callCount
    },

    _setResponses(newResponses) {
      responses.splice(0, responses.length, ...newResponses)
    },
  }

  return mockModel
}

export const MockResponses = {
  text: text => ({ text }),

  codeBlock: (code, language = 'js') => ({
    text: `Here is the code:\n\`\`\`${language}\n${code}\n\`\`\``,
  }),

  healStep: locator => ({
    text: `To fix this, try using this locator:\n\`\`\`js\nI.click('${locator}')\n\`\`\``,
  }),

  writeStep: code => ({
    text: `You can use this CodeceptJS code:\n\`\`\`js\n${code}\n\`\`\``,
  }),

  pageObject: code => ({
    text: `Here is the page object:\n\`\`\`js\n${code}\n\`\`\``,
  }),

  error: message => ({
    simulateError: true,
    text: message,
  }),
}
