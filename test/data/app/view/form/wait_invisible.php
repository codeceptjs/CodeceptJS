<html>
<head>
    <style>
        .invisible_button { display: none; }
    </style>
</head>

<body>

<div id="step_1">Step One Button</div>
<div id="step_2">Step Two Button</div>
<script>
  setTimeout(function () {
    document.getElementById('step_1').style.display = 'none';
    var step2 = document.getElementById('step_2');
    step2.parentElement.removeChild(step2);
  }, 1000);

</script>

</body>
</html>