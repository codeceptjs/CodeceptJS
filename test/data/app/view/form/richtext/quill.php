<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quill</title>
    <link href="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css" rel="stylesheet">
</head>
<body>
    <h1>Quill</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <div id="editor" style="height: 200px;"></div>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script src="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js"></script>
    <script>
        const quill = new Quill('#editor', { theme: 'snow' });
        const initial = <?php echo json_encode($initial, JSON_UNESCAPED_UNICODE); ?>;
        if (initial) quill.setText(initial);
        window.__editor = quill;
        window.__editorContent = () => quill.getText().replace(/\n+$/, '');
        window.__editorReady = true;

        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent();
        });
    </script>
</body>
</html>
