<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Native sliders</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        label { display: block; font-weight: bold; margin: 15px 0 5px; }
        input[type="range"] { width: 200px; }
    </style>
</head>
<body>
    <h1>Native sliders</h1>

    <label for="legacy-volume">Legacy volume</label>
    <input type="range" id="legacy-volume" name="volume" min="0" max="100" value="50" step="1">

    <label for="quality">Quality</label>
    <input type="range" id="quality" name="quality" min="0" max="100" value="0" step="5">

    <input type="range" id="gain" aria-label="Input gain" min="0" max="10" value="5" step="1">

    <input type="range" id="unlabeled" name="unlabeled-gain" min="0" max="10" value="5" step="1">

    <script>
        window.__value = id => document.getElementById(id).value
        window.__ready = true
    </script>
</body>
</html>
