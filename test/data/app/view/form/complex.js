/**
 * complex.js
 * Converted from PHP/HTML to pure JavaScript.
 * Runs a standalone Node.js server to serve the form for CodeceptJS testing.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Complex Form</title>
  </head>
  <body>
    <form action="/form/complex" method="POST">
      <input type="hidden" name="action" value="kill_all" />

      <fieldset disabled="disabled">
        <input type="text" id="disabled_fieldset" name="disabled_fieldset" value="disabled_fieldset" />
      </fieldset>

      <input type="text" id="disabled_field" name="disabled_field" value="disabled_field" disabled="disabled" />

      <label for="description">Description</label>
      <textarea name="description" id="description" cols="30" rows="10"></textarea>

      <label for="name">Name</label>
      <input type="text" id="name" name="name" value="" />

      <label for="age">Select your age</label>
      <select name="age" id="age">
        <option value="child">below 13</option>
        <option value="teenage">13-21</option>
        <option value="adult">21-60</option>
        <option value="oldfag">60-100</option>
        <option value="dead">100-210</option>
      </select>

      <select name="no_salutation" id="salutation" disabled="disabled">
        <option value="mr" selected="selected">Mr</option>
        <option value="ms">Mrs</option>
      </select>

      <input type="password" name="password" />

      <label for="checkin">I Agree</label>
      <input type="checkbox" id="checkin" name="terms" value="agree" checked="checked" />

      <input type="submit" value="Submit" />
    </form>

    <pre id="server-info"></pre>

    <script>
      // Simulate PHP's print_r($_SERVER)
      document.getElementById('server-info').innerText = JSON.stringify({
        host: window.location.host,
        path: window.location.pathname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent
      }, null, 2);
    </script>
  </body>
</html>`

// Start simple local web server
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Complex form running at http://127.0.0.1:8100')
  })
