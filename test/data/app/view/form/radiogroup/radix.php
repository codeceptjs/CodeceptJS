<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Radix Radio Group</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        [role="radiogroup"] { display: flex; gap: 8px; margin-bottom: 20px; }
        [role="radio"] { padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; }
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
    <h1>Radix Radio Group</h1>
    <div id="root"></div>
    <div id="result"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { RadioGroup, ToggleGroup } from 'https://esm.sh/radix-ui@1.6.7?external=react,react-dom'

        const h = React.createElement

        function App() {
            const [density, setDensity] = React.useState('comfortable')
            const [align, setAlign] = React.useState('left')

            React.useEffect(() => {
                document.getElementById('result').textContent = `density: ${density}, align: ${align}`
                window.__ready = true
            }, [density, align])

            return h(React.Fragment, null,
                h(RadioGroup.Root, { 'aria-label': 'Density', value: density, onValueChange: setDensity },
                    h(RadioGroup.Item, { value: 'compact-mode' }, 'Compact mode'),
                    h(RadioGroup.Item, { value: 'compact' }, 'Compact'),
                    h(RadioGroup.Item, { value: 'comfortable' }, 'Comfortable')),
                h('h3', { id: 'align-label' }, 'Text alignment'),
                h(ToggleGroup.Root, { type: 'single', 'aria-labelledby': 'align-label', value: align, onValueChange: value => value && setAlign(value) },
                    h(ToggleGroup.Item, { value: 'left' }, 'Left'),
                    h(ToggleGroup.Item, { value: 'center' }, 'Center'),
                    h(ToggleGroup.Item, { value: 'right' }, 'Right')))
        }

        createRoot(document.getElementById('root')).render(h(App))
    </script>
</body>
</html>
