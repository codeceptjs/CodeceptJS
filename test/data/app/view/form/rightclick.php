<html>
<head>
<script>
function printContext() {
  document.getElementById('output').innerHTML = 'right clicked';
}
</script>
</head>
<body>

<p class="context">
<a oncontextmenu="javascript:printContext();return false;">
    Lorem Ipsum
</a>
</p>

<div id="output">
</div>




</body>
</html>
