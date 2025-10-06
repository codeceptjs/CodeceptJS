/**
 * Converted from HTML to pure JavaScript.
 * This file demonstrates adding content to the DOM after a delay.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Delayed Content Demo</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
        }
    </style>
</head>

<body>

<h2>Delayed Content</h2>
<p>The "Hello" message will appear below after a 1-second delay.</p>

<div id="context"></div>

<script>
  // Create a new div element in memory
  var newDiv = document.createElement("div");
  newDiv.innerHTML = "<h1>Hello</h1>";

  // After a 1-second delay, add the new div to the page
  setTimeout(function () {
    document.getElementById('context').appendChild(newDiv);
  }, 1000);
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
    console.log('✅ Delayed Content demo view running at http://127.0.0.1:8100')
  })
