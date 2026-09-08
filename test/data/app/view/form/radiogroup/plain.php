<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Plain radio group</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        [role="radiogroup"] { display: flex; gap: 8px; margin-bottom: 20px; }
        [role="radio"] { padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; }
        [role="radio"][aria-checked="true"] { background: #333; color: #fff; }
        #result { font-family: monospace; }
    </style>
</head>
<body>
    <h1>Plain radio group</h1>

    <div role="radiogroup" id="density" aria-label="Density">
        <button type="button" role="radio" aria-checked="false">Compact mode</button>
        <button type="button" role="radio" aria-checked="false">Compact</button>
        <button type="button" role="radio" aria-checked="true">Comfortable</button>
    </div>

    <h3 id="theme-label">Theme</h3>
    <div role="radiogroup" id="theme" aria-labelledby="theme-label">
        <button type="button" role="radio" aria-checked="true">Light</button>
        <button type="button" role="radio" aria-checked="false">Dark</button>
        <button type="button" role="radio" aria-checked="false">System</button>
    </div>

    <select name="framework" id="framework" aria-label="Framework">
        <option value="">Choose</option>
        <option value="next">Next.js</option>
        <option value="remix">Remix</option>
    </select>

    <div id="result">density: Comfortable, theme: Light, framework: </div>

    <script>
        function report() {
            const value = id => {
                const group = document.getElementById(id)
                const checked = group.querySelector('[role="radio"][aria-checked="true"]')
                return checked ? checked.textContent.trim() : ''
            }
            document.getElementById('result').textContent =
                `density: ${value('density')}, theme: ${value('theme')}, framework: ${document.getElementById('framework').value}`
        }

        document.querySelectorAll('[role="radiogroup"]').forEach(group => {
            group.addEventListener('click', event => {
                const radio = event.target.closest('[role="radio"]')
                if (!radio || !group.contains(radio)) return
                group.querySelectorAll('[role="radio"]').forEach(el => el.setAttribute('aria-checked', String(el === radio)))
                report()
            })
        })
        document.getElementById('framework').addEventListener('change', report)
        window.__ready = true
    </script>
</body>
</html>
