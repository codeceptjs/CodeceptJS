const createAdvancedTestResults = (url, dataToCheck, requests) => {
  // Creates advanced test results for a network traffic check.
  // Advanced test results only applies when expected parameters are set
  if (!dataToCheck) return '';

  let urlFound = false;
  let advancedResults;
  requests.forEach((request) => {
    // url not found in this request. continue with next request
    if (urlFound || !request.url.match(new RegExp(url))) return;
    urlFound = true;

    // Url found. Now we create advanced test report for that URL and show which parameters failed
    if (!request.requestPostData) {
      advancedResults = allParameterValuePairsMatchExtreme(extractQueryObjects(request.url), dataToCheck);
    } else if (request.requestPostData) {
      advancedResults = allRequestPostDataValuePairsMatchExtreme(request.requestPostData, dataToCheck);
    }
  });
  return advancedResults;
};

const extractQueryObjects = (queryString) => {
  // Converts a string of GET parameters into an array of parameter objects. Each parameter object contains the properties "name" and "value".
  if (queryString.indexOf('?') === -1) {
    return [];
  }
  const queryObjects = [];

  const queryPart = queryString.split('?')[1];

  const queryParameters = queryPart.split('&');

  queryParameters.forEach((queryParameter) => {
    const keyValue = queryParameter.split('=');
    const queryObject = {};
    // eslint-disable-next-line prefer-destructuring
    queryObject.name = keyValue[0];
    queryObject.value = decodeURIComponent(keyValue[1]);
    queryObjects.push(queryObject);
  });

  return queryObjects;
};

const allParameterValuePairsMatchExtreme = (queryStringObject, advancedExpectedParameterValuePairs) => {
  // More advanced check if all request parameters match with the expectations
  let littleReport = '\nQuery parameters:\n';
  let success = true;

  for (const expectedKey in advancedExpectedParameterValuePairs) {
    if (!Object.prototype.hasOwnProperty.call(advancedExpectedParameterValuePairs, expectedKey)) {
      continue;
    }
    let parameterFound = false;
    const expectedValue = advancedExpectedParameterValuePairs[expectedKey];

    for (const queryParameter of queryStringObject) {
      if (queryParameter.name === expectedKey) {
        parameterFound = true;
        if (expectedValue === undefined) {
          littleReport += `   ${expectedKey.padStart(10, ' ')}\n`;
        } else if (typeof expectedValue === 'object' && expectedValue.base64) {
          const decodedActualValue = Buffer.from(queryParameter.value, 'base64').toString('utf8');
          if (decodedActualValue === expectedValue.base64) {
            littleReport += `   ${expectedKey.padStart(10, ' ')} = base64(${expectedValue.base64})\n`;
          } else {
            littleReport += ` ✖ ${expectedKey.padStart(10, ' ')} = base64(${expectedValue.base64})     -> actual value: "base64(${decodedActualValue})"\n`;
            success = false;
          }
        } else if (queryParameter.value === expectedValue) {
          littleReport += `   ${expectedKey.padStart(10, ' ')} = ${expectedValue}\n`;
        } else {
          littleReport += ` ✖ ${expectedKey.padStart(10, ' ')} = ${expectedValue}      -> actual value: "${queryParameter.value}"\n`;
          success = false;
        }
      }
    }

    if (parameterFound === false) {
      littleReport += ` ✖ ${expectedKey.padStart(10, ' ')}${expectedValue ? ` = ${JSON.stringify(expectedValue)}` : ''}      -> parameter not found in request\n`;
      success = false;
    }
  }

  return success ? true : littleReport;
};

const allRequestPostDataValuePairsMatchExtreme = (RequestPostDataObject, advancedExpectedRequestPostValuePairs) => {
  // More advanced check if all request post data match with the expectations
  let littleReport = '\nRequest Post Data:\n';
  let success = true;

  for (const expectedKey in advancedExpectedRequestPostValuePairs) {
    if (!Object.prototype.hasOwnProperty.call(advancedExpectedRequestPostValuePairs, expectedKey)) {
      continue;
    }
    let keyFound = false;
    const expectedValue = advancedExpectedRequestPostValuePairs[expectedKey];

    for (const [key, value] of Object.entries(RequestPostDataObject)) {
      if (key === expectedKey) {
        keyFound = true;
        if (expectedValue === undefined) {
          littleReport += `   ${expectedKey.padStart(10, ' ')}\n`;
        } else if (typeof expectedValue === 'object' && expectedValue.base64) {
          const decodedActualValue = Buffer.from(value, 'base64').toString('utf8');
          if (decodedActualValue === expectedValue.base64) {
            littleReport += `   ${expectedKey.padStart(10, ' ')} = base64(${expectedValue.base64})\n`;
          } else {
            littleReport += ` ✖ ${expectedKey.padStart(10, ' ')} = base64(${expectedValue.base64})     -> actual value: "base64(${decodedActualValue})"\n`;
            success = false;
          }
        } else if (value === expectedValue) {
          littleReport += `   ${expectedKey.padStart(10, ' ')} = ${expectedValue}\n`;
        } else {
          littleReport += ` ✖ ${expectedKey.padStart(10, ' ')} = ${expectedValue}      -> actual value: "${value}"\n`;
          success = false;
        }
      }
    }

    if (keyFound === false) {
      littleReport += ` ✖ ${expectedKey.padStart(10, ' ')}${expectedValue ? ` = ${JSON.stringify(expectedValue)}` : ''}      -> key not found in request\n`;
      success = false;
    }
  }

  return success ? true : littleReport;
};

module.exports = {
  createAdvancedTestResults,
  extractQueryObjects,
  allParameterValuePairsMatchExtreme,
  allRequestPostDataValuePairsMatchExtreme,
};
