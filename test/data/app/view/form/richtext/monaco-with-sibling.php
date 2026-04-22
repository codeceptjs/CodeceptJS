<?php $initial = isset($_GET['initial']) ? $_GET['initial'] : ''; ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Monaco in iframe with sibling input</title>
</head>
<body>
    <h1>Monaco in iframe with sibling input</h1>
    <form id="outer-form" method="post" action="/richtext_submit">
        <input id="outer-title" name="outer-title" placeholder="Title" type="search" autofocus>
        <iframe id="monaco-frame" src="/form/richtext/monaco<?php echo $initial !== '' ? '?initial=' . urlencode($initial) : ''; ?>" style="width: 100%; height: 320px; border: 1px solid #ccc;"></iframe>
        <input type="hidden" name="content" id="content-sync">
        <button type="submit" id="submit">Submit</button>
    </form>
    <script>
        window.__editorReady = false;
        const frame = document.getElementById('monaco-frame');
        frame.addEventListener('load', function () {
            const poll = setInterval(function () {
                try {
                    if (frame.contentWindow && frame.contentWindow.__editorReady) {
                        window.__editorReady = true;
                        clearInterval(poll);
                    }
                } catch (e) {}
            }, 100);
        });
        document.getElementById('outer-form').addEventListener('submit', function () {
            try {
                const getValue = frame.contentWindow && frame.contentWindow.__editorContent;
                document.getElementById('content-sync').value = getValue ? getValue() : '';
            } catch (e) {
                document.getElementById('content-sync').value = '';
            }
        });
        document.getElementById('outer-title').focus();
    </script>
</body>
</html>
