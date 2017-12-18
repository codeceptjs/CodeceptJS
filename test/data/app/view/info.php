<!DOCTYPE HTML>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>

<h1>Information</h1>

<p>Lots of valuable data here

    <a href="/" id="back" aria-label="index"><img src="blank.gif" alt="Back"/></a>
</p>

<div class="notice"><?php if (isset($notice)) echo $notice; ?></div>

<h3>Don't do that at home!</h3>

<p>Is that interesting?</p>

<form action="/" method="post">
    <input type="checkbox" name="interesting" value="1" checked="checked"/>
    <input type="text" name="rus" value="Верно"/>
    <input type="submit"/>
</form>

<p>Текст на русском</p>
<a href="/">Ссылочка</a>

<a href="/login" class="sign">Sign in!</a>

<div>Kill & Destroy</div>

<div style="display: none" class="hidden">
    Invisible text
</div>

<div id="grab-multiple">
    <a id="first-link">First</a>
    <a id="second-link">Second</a>
    <a id="third-link">Third</a>
</div>

<div id="new-tab">
<a href="/login" target="_blank">New tab</a>
</div>

</body>
</html>
