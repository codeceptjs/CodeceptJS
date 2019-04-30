<html>
<body>
<form action="/form/complex" method="POST" enctype="multipart/form-data">
    <label for="avatar">Avatar</label>
    <input type="file" id="avatar" name="avatar" />
    <input type="submit" value="Submit" />
</form>
<form action="/form/complex" method="POST" enctype="multipart/form-data">
    <input type="file" id="hidden" name="hidden" style="display: none;" />
    <input type="submit" value="Submit" />
</form>
</body>
</html>