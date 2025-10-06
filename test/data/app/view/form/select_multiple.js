/**
 * multiSelectFormDemo.js
 * Converted from HTML to pure JavaScript.
 * This file can be used directly for testing a form with a multi-select dropdown.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Multi-Select Form Demo</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
        }
        select {
            /* Give the multi-select box some height to be usable */
            min-height: 120px;
            min-width: 200px;
            padding: 5px;
        }
        label, p {
            display: block;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>

<h2>Multi-Select Dropdown Example</h2>
<p>
    <strong>Note:</strong> Hold down the Ctrl (Windows) / Command (Mac) button to select multiple options.
</p>

<form action="/form/complex" method="POST">
    <label for="like">What do you like the most?</label>
    <select name="like[]" id="like" multiple="multiple">
        <option value="eat">Eat and Drink</option>
        <option value="play">Play Video Games</option>
        <option value="adult">Have Sex</option>
        <option value="drugs">Take some drugs</option>
        <option value="code">Fuck that shit, just CODE!</option>
    </select>
    <br><br>
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
    console.log('✅ Multi-Select Form demo view running at http://127.0.0.1:8100')
  })
