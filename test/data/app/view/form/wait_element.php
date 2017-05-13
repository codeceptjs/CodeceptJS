<html>

<body>

<div id="context"></div>
<script>

var newDiv = document.createElement("div");
        newDiv.innerHTML = "<h1>Hello</h1>";

  setTimeout(function () {
    document.getElementById('context').appendChild(newDiv);
  }, 1000);


</script>

</body>
</html>