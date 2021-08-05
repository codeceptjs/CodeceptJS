const { chromium } = require('playwright');

(async () => {
  const browserServer = await chromium.launchServer();
  const wsEndpoint = browserServer.wsEndpoint();
  console.log(wsEndpoint);
  // Use web socket endpoint later to establish a connection.
  // const browser = await chromium.connect({ wsEndpoint });
  // // Close browser instance.
  // await browserServer.close();
})();
