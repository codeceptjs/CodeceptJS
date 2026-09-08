<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Base UI Radio Group</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        [role="radiogroup"] { display: flex; gap: 8px; margin-bottom: 20px; }
        [role="radio"] { display: inline-block; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; }
        [role="radio"][aria-checked="true"] { background: #333; color: #fff; }
        #result { font-family: monospace; }
    </style>
    <script type="importmap">
    {"imports": {
      "react": "https://esm.sh/react@19.2.0",
      "react/jsx-runtime": "https://esm.sh/react@19.2.0/jsx-runtime",
      "react-dom": "https://esm.sh/react-dom@19.2.0",
      "react-dom/client": "https://esm.sh/react-dom@19.2.0/client"
    }}
    </script>
</head>
<body>
    <h1>Base UI Radio Group</h1>
    <div id="root"></div>
    <div id="result"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { RadioGroup } from 'https://esm.sh/@base-ui-components/react@1.0.0-rc.0/radio-group?external=react,react-dom'
        import { Radio } from 'https://esm.sh/@base-ui-components/react@1.0.0-rc.0/radio?external=react,react-dom'

        const h = React.createElement

        function App() {
            const [density, setDensity] = React.useState('comfortable')
            const [theme, setTheme] = React.useState('light')

            React.useEffect(() => {
                document.getElementById('result').textContent = `density: ${density}, theme: ${theme}`
                window.__ready = true
            }, [density, theme])

            return h(React.Fragment, null,
                h(RadioGroup, { 'aria-label': 'Density', value: density, onValueChange: setDensity },
                    h(Radio.Root, { value: 'compact-mode' }, 'Compact mode'),
                    h(Radio.Root, { value: 'compact' }, 'Compact'),
                    h(Radio.Root, { value: 'comfortable' }, 'Comfortable')),
                h('h3', { id: 'theme-label' }, 'Theme'),
                h(RadioGroup, { 'aria-labelledby': 'theme-label', value: theme, onValueChange: setTheme },
                    h(Radio.Root, { value: 'light' }, 'Light'),
                    h(Radio.Root, { value: 'dark' }, 'Dark'),
                    h(Radio.Root, { value: 'system' }, 'System')))
        }

        createRoot(document.getElementById('root')).render(h(App))
    </script>
</body>
</html>
