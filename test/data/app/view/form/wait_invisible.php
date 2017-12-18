<html>
<head>
    <style>
        .invisible_button { display: none; }
    </style>
</head>

<body>

<div id="step_1">Step One Button</div>
<script>
  setTimeout(function () {
    document.getElementById('step_1').style.display = 'none';
  }, 1000);


</script>

</body>
</html>