<html>

<body>

<div id="context"></div>
<div id="output"></div>
<script>

var newDiv = document.createElement("div");
    newDiv.innerHTML = "<a onclick='print()' id='click'>Hello world</a>";
    newDiv.id="linkContext";

  setTimeout(function () {
    document.getElementById('context').appendChild(newDiv);
  }, 2000);

  function print() {
    document.getElementById('output').innerText = 'Hi!';
  }


</script>

</body>
</html>