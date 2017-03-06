<html>
<body>
<form action="/form/complex" method="POST">
    <label>
      <div>Select a value:</div>
      <div>
        <select name="select" id="select">
            <option value=""></option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
        </select>
      </div>
    </label>
    <input id="submit" disabled="disabled" type="submit" value="Submit" />
</form>
<script>
  document.getElementById('select').addEventListener('change', function() {
    var submit = document.getElementById('submit');
    if (this.value === "") {
      submit.setAttributeNode("disabled", "disabled");
    } else {
      var disabled = submit.getAttributeNode("disabled");
      submit.removeAttributeNode(disabled);
    }
  });
</script>
</body>
</html>
