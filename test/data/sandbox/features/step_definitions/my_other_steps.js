const I = actor();
const axios = require('axios');

Given('I have products in my cart', (table) => { // eslint-disable-line
  for (const id in table.rows) {
    if (id < 1) {
      continue;
    }
    const cells = table.rows[id].cells;
    I.addProduct(cells[0].value, parseInt(cells[2].value, 10));
  }
});

Given(/I have product described as/, (text) => {
  I.addItem(text.content.length);
});

Given(/I have simple product/, async () => {
  return new Promise((resolve) => {
    I.addItem(10);
    setTimeout(resolve, 0);
  });
});

const sendRequest = async (requestConfig) => {
  if (!requestConfig) throw JSON.stringify({ error: 'Request config is null or undefined.' });
  return await axios({
      method: requestConfig.method || 'GET',
      timeout: requestConfig.timeout || 3000,
      ...requestConfig
  }).catch(error => {
      if (error.response) {
          error = {
              message: 'The request was made and the server responded with a status code.',
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers,
              request: error.config.data,
              url: error.response.config.url
          };
      } else if (error.request) {
          error = {
              message: 'The request was made but no response was received.',
              request: error.request,
          };
      } else {
          error = {
              message: `Something happened in setting up the request that triggered an Error.\n${error.message}`,
          };
      }
      throw error;
  });
};

Given(/^I make a request \(and it fails\)$/, async () => {
  const requestPayload = {
      method: "GET",
      url: `https://google.com`,
      headers: {
          Cookie: "featureConfig=%7B%22enableCaptcha%22%3A%220%22%7D",
          "X-Requested-With": "XMLHttpRequest",
      },
      timeout: 1
  };

  await sendRequest(requestPayload);
});

Then(/^my test execution gets stuck$/, async () => {
  await I.say("Test execution never gets here...");
});