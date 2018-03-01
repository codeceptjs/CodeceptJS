<html>
<body>

<input id="text" type="text" name="test" disabled="true" value="some text">

<button id="button" type="button" name="button1" disabled="true" value="first" onclick="updateMessage('button was clicked')">A Button</button>

<div id="message"></div>

<script>
  setTimeout(function () {
    document.querySelector('#text').disabled = false;
    document.querySelector('#button').disabled = false;
  }, 1000);

  function updateMessage(msg) {
    document.querySelector('#message').textContent = msg;
  }
</script>
</body>
</html>
