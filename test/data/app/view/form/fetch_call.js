/**
 * Converted from HTML to pure JavaScript.
 * This file can be used directly for testing client-side fetch operations.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Fetch JSON data</title>
    <style>
      body { font-family: sans-serif; }
      td {
        padding: 4px;
        border: 1px solid #333333;
        vertical-align: top;
      }
      button {
        margin: 5px 0;
      }
    </style>
  </head>
  <body>
    <h3>JSON data</h3>
    <button onclick="getPostData()">GET POSTS</button>
    <button onclick="getCommentsData()">GET COMMENTS</button>
    <button onclick="getUsersData()">GET USERS</button>
    <div id="data">
      <h4>No data here</h4>
    </div>
  </body>

  <script type="text/javascript">
    const tableData = data =>
      Object.entries(data).reduce(
        (html, [key, value]) => \`\${html}
            <tr>
              <td><b>\${key}</b></td>
              <td>\${typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : value}</td>
            </tr>
          \`,
        ""
      );

    const data = document.querySelector("#data");

    const getData = url =>
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(json => {
          data.innerHTML = \`<table>
            \${tableData(json)}
          </table>\`;

          console.log(json);
        })
        .catch((error) => {
          console.error('Fetch error:', error);
          data.innerHTML = "Can not load data!";
        });

    const getPostData = () =>
      getData("https://jsonplaceholder.typicode.com/posts/1");
    const getCommentsData = () =>
      // This will likely fail unless you have a local server running on port 3001
      getData("http://localhost:3001/api/comments/1");
    const getUsersData = () =>
      getData("https://jsonplaceholder.typicode.com/users/1");
  <\/script>
</html>`

// Run a simple local server to serve this HTML
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Fetch JSON demo view running at http://127.0.0.1:8100')
  })
