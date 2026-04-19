<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Summernote</title>
    <link href="https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote-lite.min.css" rel="stylesheet">
</head>
<body>
    <h1>Summernote</h1>
    <form id="richtext-form" method="post" action="/richtext_submit">
        <div id="editor"></div>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote-lite.min.js"></script>
    <script>
        $(document).ready(function() {
            $('#editor').summernote({ height: 150 });
            const initial = <?php echo json_encode($initial, JSON_UNESCAPED_UNICODE); ?>;
            if (initial) $('#editor').summernote('code', initial.split(/\n{2,}/).map(p => '<p>' + p.replace(/</g, '&lt;') + '</p>').join(''));
            window.__editor = $('#editor');
            window.__editorContent = () => {
                const div = document.createElement('div');
                div.innerHTML = $('#editor').summernote('code') || '';
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
