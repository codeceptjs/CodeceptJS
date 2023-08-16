<html>
    <title>TestEd Beta 2.0</title>
<body>

<h1>Welcome&nbsp;to test app!</h1>

<div class="notice" qa-id = "test"><?php if (isset($notice)) echo $notice; ?></div>

<p>
    <a href="/info" id="link" qa-id = "test" qa-link = "test">More info</a>
</p>


<div id="area1" qa-id = "test" qa-id = "test">
    <a href="/form/file" qa-id = "test" qa-link = "test"> Test Link </a>
</div>
<div id="area2" qa-id = "test">
    <a href="/form/hidden" qa-id = "test" qa-link = "test">Test</a>
</div>
<div id="area3" qa-id = "test">
    <a href="info" qa-id = "test" qa-link = "test">Document-Relative Link</a>
</div>
<div id="area4" qa-id = "test">
  <a href="/spinner" qa-id = "test" qa-link = "test">Spinner</a>
</div>

A wise man said: "debug!"

<?php print_r($_POST); ?>

</body>
</html>
