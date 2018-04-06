<html>
<head>
    <style>
        body { width: 300px; overflow-x: scroll; }
        .section1 { min-height: 500px; width: 1000px; overflow-x: scroll; }
        .section2 { min-height: 500px; width: 1000px; overflow-x: scroll; }
        .section3 { min-height: 500px; width: 1000px; overflow-x: scroll; }
        button, input { width: 300px; }
        .form3 { width: 400px; display: flex; }
    </style>
</head>

<body>

<div id="section_1" class="section1">
    <h1>Section One</h1>
        <form method="POST" action="/form/form_with_buttons">
            <input type="text" name="test">
            <button type="button" name="button1" value="first">A Button</button>
            <input type="button" name="button2" value="second">
            <input type="submit" name="button3" value="third">
            <button type="submit" name="button4" value="fourth">A Submit Button</button>
        </form>
</div>
<div id="section_2" class="section2">
    <h1>Section two</h1>
    <form method="POST" action="/form/form_with_buttons">
        <input type="text" name="test">
        <button type="button" name="button1" value="first">A Button</button>
        <input type="button" name="button2" value="second">
        <input type="submit" name="button3" value="third">
        <button type="submit" name="button4" value="fourth">A Submit Button</button>
    </form>
</div>
<div id="section_3" class="section3">
    <h1>Section three</h1>
    <form method="POST" action="/form/form_with_buttons" class="form3">
        <input type="text" name="test">
        <button type="button" name="button1" value="first">A Button</button>
        <input type="button" name="button2" value="second">
        <input type="submit" name="button3" value="third">
        <button type="submit" name="button4" value="fourth">A Submit Button</button>
    </form>
</div>
<script>

</script>

</body>
</html>