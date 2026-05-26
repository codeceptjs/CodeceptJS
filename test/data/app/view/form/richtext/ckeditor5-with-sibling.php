<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CKEditor 5 with sibling input</title>
</head>
<body>
    <h1>CKEditor 5 with sibling input</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <input id="outer-title" name="outer-title" placeholder="Title" type="search" autofocus>
        <div id="editor">
            <textarea id="editor-inner"><?php echo htmlspecialchars($initial, ENT_QUOTES | ENT_HTML5, 'UTF-8'); ?></textarea>
        </div>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js"></script>
    <script>
        ClassicEditor.create(document.querySelector('#editor-inner'), {
            removePlugins: ['TextTransformation']
        }).then(editor => {
            window.__editor = editor;
            window.__editorContent = () => {
                const div = document.createElement('div');
                div.innerHTML = editor.getData() || '';
                return (div.textContent || '').replace(/ /g, ' ').trim();
            };
            window.__editorReady = true;
        });
        document.getElementById('richtext-form').addEventListener('submit', function() {
            document.getElementById('content-sync').value = window.__editorContent ? window.__editorContent() : '';
        });
        document.getElementById('outer-title').focus();
    </script>
</body>
</html>
