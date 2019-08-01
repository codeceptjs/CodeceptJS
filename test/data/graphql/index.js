const TestHelper = require('../../support/TestHelper');
const express = require('express');

const PORT = TestHelper.graphQLServerPort();
const app = express();


app.listen(PORT, () => console.log(`test graphQL server listening on port ${PORT}...`));
