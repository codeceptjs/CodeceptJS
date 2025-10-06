/**
 * Converted from HTML to pure JavaScript.
 * This file demonstrates enabling a submit button based on a dropdown selection.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Conditional Submit Demo</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
        }
        input[type="submit"]:disabled {
            background-color: #ccc;
            color: #666;
            cursor: not-allowed;
        }
    </style>
</head>
<body>

<h2>Enable Button on Selection</h2>
<p>The submit button is disabled until you select an option.</p>

<form action="/form/complex" method="POST">
    <label>
      <div>Select a value:</div>
      <div>
        <select name="select" id="select">
            <option value="">-- Please choose an option --</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
        </select>
      </div>
    </label>
    <br><br>
    <input id="submit" disabled type="submit" value="Submit" />
</form>

<script>
  document.getElementById('select').addEventListener('change', function() {
    var submitButton = document.getElementById('submit');
    // This is a common way to enable/disable an element.
    // The expression (this.value === "") evaluates to true or false.
    submitButton.disabled = (this.value === "");
  });
<\/script>

</body>
</html>`

// Run a simple local server to serve this HTML
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Conditional Submit demo view running at http://127.0.0.1:8100')
  })
