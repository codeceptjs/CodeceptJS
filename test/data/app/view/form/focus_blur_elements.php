<!DOCTYPE html>
<html>
<head>
    <title>Test Focus and Blur</title>
    <style>
        .message {
            display: inline-block;
            margin-left: 10px;
        }
    </style>
</head>
<body>

<button id="button">Button</button>
<span id="buttonMessage" class="message">Button not focused</span>

<br/><br/>

<input type="text" id="field" placeholder="Type Here">
<span id="fieldMessage" class="message">Input field not focused</span>

<br/><br/>

<textarea id="textarea" placeholder="Write Here"></textarea>
<span id="textareaMessage" class="message">Textarea not focused</span>

<script>
  document.getElementById('button').addEventListener('focus', function() {
    document.getElementById('buttonMessage').innerText = 'Button is focused';
  });

  document.getElementById('button').addEventListener('blur', function() {
    document.getElementById('buttonMessage').innerText = 'Button not focused';
  });

  document.getElementById('field').addEventListener('focus', function() {
    document.getElementById('fieldMessage').innerText = 'Input field is focused';
  });

  document.getElementById('field').addEventListener('blur', function() {
    document.getElementById('fieldMessage').innerText = 'Input field not focused';
  });

  document.getElementById('textarea').addEventListener('focus', function() {
    document.getElementById('textareaMessage').innerText = 'Textarea is focused';
  });

  document.getElementById('textarea').addEventListener('blur', function() {
    document.getElementById('textareaMessage').innerText = 'Textarea not focused';
  });
</script>

</body>
</html>
