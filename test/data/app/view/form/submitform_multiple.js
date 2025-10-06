/**
 * Converted from HTML to pure JavaScript.
 * This file demonstrates a multi-select with disabled options and optgroups.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Testing submitForm with select multiple</title>
<style>
    body {
        font-family: sans-serif;
        padding: 20px;
    }
    select {
        min-height: 150px;
        min-width: 200px;
    }
    p {
        margin-bottom: 10px;
    }
</style>
</head>
<body>

<h2>Multi-Select with Disabled Options</h2>
<p>
    <strong>Note:</strong> Disabled options or options within a disabled group are not submittable, even if they appear "selected" by default.
</p>

<form method="POST" action="/form/complex">
    <select name="select[]" multiple>
        <optgroup label="first part" disabled>
            <option value="not seen one">Not selected</option>
            <option value="not seen two" selected>Selected</option>
        </optgroup>
        <option value="not seen three" selected disabled>Not selected</option>
        <option value="see test one" selected>Selected</option>
        <option value="not seen four">Not selected</option>
        <option value="see test two" selected>Selected</option>
    </select>
    <br><br>
    <input type="submit" name="submit" value="Submit" />
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
    console.log('✅ Advanced Multi-Select demo view running at http://127.0.0.1:8100')
  })
