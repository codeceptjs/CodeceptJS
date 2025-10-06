/**
 * Converted from HTML to pure JavaScript.
 * This file demonstrates elements being hidden or removed from the DOM after a delay.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Disappearing Elements Demo</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
        }
        .invisible_button { display: none; }
        div {
            padding: 10px;
            margin: 5px 0;
            border: 1px solid #333;
            background-color: #f0f0f0;
            width: 150px;
            text-align: center;
        }
    </style>
</head>

<body>

<h2>Disappearing Elements</h2>
<p>After 1 second, "Step One" will be hidden and "Step Two" will be removed entirely.</p>

<div id="step_1">Step One Button</div>
<div id="step_2">Step Two Button</div>

<script>
  setTimeout(function () {
    // This button becomes invisible but is still in the DOM
    var step1 = document.getElementById('step_1');
    if (step1) {
        step1.style.display = 'none';
    }

    // This button is completely removed from the DOM
    var step2 = document.getElementById('step_2');
    if (step2 && step2.parentElement) {
        step2.parentElement.removeChild(step2);
    }
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
    console.log('✅ Disappearing Elements demo view running at http://127.0.0.1:8100')
  })
