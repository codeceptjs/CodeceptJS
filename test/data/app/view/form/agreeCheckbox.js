/**
 * agreeCheckbox.js
 * Converted from HTML to pure JavaScript.
 * This version runs a simple Node.js server serving the checkbox form.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Checkbox Form</title>
  </head>
  <body>
    <form action="/form/complex" method="POST">
      <label for="checkin">I Agree</label>
      <input type="checkbox" id="checkin" name="terms" value="agree"
        onclick="document.getElementById('notice').innerHTML = 'ticked'" />
      <input type="submit" value="Submit" />
    </form>
    <div id="notice"></div>
  </body>
</html>`

// Start local web server
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Checkbox form running at http://127.0.0.1:8100')
  })
