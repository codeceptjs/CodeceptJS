/**
 * Converted from HTML to pure JavaScript.
 * This file can be used directly for testing a form with a select dropdown.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Select Form Demo</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
        }
        label {
            margin-right: 10px;
        }
        select, input {
            padding: 5px;
        }
    </style>
</head>
<body>

<h2>Dropdown Menu (Select) Example</h2>

<form action="/form/complex" method="POST">
    <label for="age">Select your age</label>
    <select name="age" id="age">
        <option value="child">
            below 13
        </option>
        <option value="teenage">
            13-21
        </option>
        <option value="adult">
            21-60
        </option>
        <option value="oldfag" selected="selected">
            60-100
        </option>
        <option value="dead">
            100-210
        </option>
    </select>
    <input type="submit" value="Submit" />
</form>

</body>
</html>`

// Run a simple local server to serve this HTML
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Select Form demo view running at http://127.0.0.1:8100')
  })
