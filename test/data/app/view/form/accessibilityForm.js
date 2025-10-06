/**
 * accessibilityForm.js
 * Converted from Accessibility HTML to pure JavaScript.
 * Runs as a standalone Node.js server for CodeceptJS testing.
 */

const http = require('http')

const html = `<!doctype html>
<html>
  <head>
    <title>Accessibility</title>
  </head>
  <body>
    <form action="/form/complex" method="POST">
      <div id="myBillingId">Billing</div>

      <div>
        <div id="myNameId">Name</div>
        <input type="text" name="my-form-name" aria-labelledby="myBillingId myNameId" />
      </div>

      <div>
        <div id="myAddressId">Address</div>
        <input type="text" aria-label="My Address" name="my-form-address" aria-labelledby="myBillingId myAddressId" />
      </div>

      <div id="myPhoneId">Phone</div>
      <input type="text" name="my-form-phone" aria-labelledby="myPhoneId" />
      <input type="submit" value="Submit" />
    </form>

    <div>
      <div aria-label="get info" onclick="window.location.href='/info'">&raquo;</div>
    </div>
  </body>
</html>`

// Run local server
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Accessibility form running at http://127.0.0.1:8100')
  })
