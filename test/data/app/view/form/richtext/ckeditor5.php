<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CKEditor 5</title>
</head>
<body>
    <h1>CKEditor 5</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <textarea id="editor"><?php echo htmlspecialchars($initial, ENT_QUOTES | ENT_HTML5, 'UTF-8'); ?></textarea>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js"></script>
    <script>
        ClassicEditor.create(document.querySelector('#editor'), {
            removePlugins: ['TextTransformation']
        }).then(editor => {
            window.__editor = editor;
            window.__editorContent = () => {
                const div = document.createElement('div');
                div.innerHTML = editor.getData() || '';
                return (div.textContent || '').replace(/\u00a0/g, ' ').trim();
            };
            window.__editorReady = true;
        });
        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : '';
        });
    </script>
</body>
</html>
