<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>dblclick demo</title>
  <style>
  div {
    background: blue;
    color: white;
    height: 100px;
    width: 150px;
    user-select: text;
 }
  div.dbl {
    background: yellow;
    color: black;
  }
  </style>
  <script src="https://code.jquery.com/jquery-1.10.2.js"></script>
</head>
<body>

<div id="block"></div>
<span id="message">Double click the block</span>

<script>
var divdbl = $("#block");
divdbl.dblclick(function() {
  divdbl.toggleClass( "dbl" );
  $('#message').text('Done!');
});
</script>

</body>
</html>
