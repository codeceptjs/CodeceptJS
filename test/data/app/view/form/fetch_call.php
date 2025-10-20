<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Fetch JSON data</title>
    <style>
      td {
        padding: 4px;
        border: 1px solid #333333;
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
        (html, [key, value]) => `${html}
            <tr>
              <td>${key}</td>
              <td>${value}</td>
            </tr>
          `,
        ""
      );

    const data = document.querySelector("#data");

    const getData = url =>
      fetch(url)
        .then(response => response.json())
        .then(json => {
          data.innerHTML = `<table>
            ${tableData(json)}
          </table>`;

          console.log(json);
        })
        .catch(() => {
          data.innerHTML = "Can not load data!";
        });

    const getPostData = () =>
      getData("https://jsonplaceholder.typicode.com/posts/1");
    const getCommentsData = () =>
      getData("https://reqres.in/api/comments/1");
    const getUsersData = () =>
      getData("https://jsonplaceholder.typicode.com/users/1");
  </script>
</html>
