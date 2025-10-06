/**
 * Converted from HTML to pure JavaScript.
 * This file can be used directly for testing.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Application</title>
</head>
<body>
<form method="POST" action="/form/complex" accept-charset="UTF-8" role="form" class="crud-form big-bottom">
    <fieldset>
        <legend>Create New Widget</legend>
        <div class="form-group">
            <label for="title">Widget Title</label>
            <input class="form-control" placeholder="Widget Title" name="title" type="text" id="title">
        </div>
        <div class="form-group">
            <label for="description">Description</label>
            <textarea class="form-control" placeholder="Description" name="description" cols="50" rows="10" id="description"></textarea>
        </div>
        <div class="form-group">
            <label for="price">Price</label>
            <input class="form-control" placeholder="Price" name="price" type="text" id="price">
        </div>
        <input class="btn btn-primary btn-block" type="submit" value="Create">
    </fieldset>
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
    console.log('✅ Create Widget form view running at http://127.0.0.1:8100')
  })
