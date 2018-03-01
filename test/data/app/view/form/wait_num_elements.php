<html>

<body>

<div id="context"></div>
<script>

var newDiv = document.createElement("div");
newDiv.innerHTML = '<h1 class="title">Hello</h1>';

var newDiv2 = document.createElement("div");
newDiv2.innerHTML = '<h2 class="title">World</h2>';

setTimeout(function () {
    document.getElementById('context').appendChild(newDiv);
}, 1000);

setTimeout(function () {
    document.getElementById('context').appendChild(newDiv2);
}, 1500);


</script>

</body>
</html>