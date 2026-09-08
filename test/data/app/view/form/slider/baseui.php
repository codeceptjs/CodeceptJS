<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Base UI Slider</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        label { display: block; font-weight: bold; margin-bottom: 5px; }
        .Control { display: flex; align-items: center; width: 200px; height: 20px; }
        .Track { display: block; position: relative; width: 100%; height: 4px; background: #ccc; border-radius: 9999px; }
        .Indicator { display: block; position: absolute; height: 100%; background: #333; border-radius: 9999px; }
        .Thumb { display: block; width: 16px; height: 16px; background: #fff; border: 2px solid #333; border-radius: 50%; }
        .row { margin-bottom: 30px; }
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
    <h1>Base UI Slider</h1>
    <div id="root"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { Slider } from 'https://esm.sh/@base-ui/react@1.8.0/slider?external=react,react-dom'
        import { Field } from 'https://esm.sh/@base-ui/react@1.8.0/field?external=react,react-dom'

        const h = React.createElement

        function Row({ label, step, defaultValue, thumbClass }) {
            return h(Field.Root, { className: 'row' },
                h(Field.Label, null, label),
                h(Slider.Root, { defaultValue, min: 0, max: 100, step },
                    h(Slider.Control, { className: 'Control' },
                        h(Slider.Track, { className: 'Track' },
                            h(Slider.Indicator, { className: 'Indicator' }),
                            h(Slider.Thumb, { className: thumbClass })))))
        }

        function App() {
            return h(React.Fragment, null,
                h(Row, { label: 'Volume', step: 1, defaultValue: 50, thumbClass: 'Thumb' }),
                h(Row, { label: 'Base quality', step: 5, defaultValue: 0, thumbClass: 'Thumb' }),
                h(Row, { label: 'Collapsed gain', step: 1, defaultValue: 0, thumbClass: 'BareThumb' }))
        }

        createRoot(document.getElementById('root')).render(h(App))

        window.__sliderValue = name => {
            const label = [...document.querySelectorAll('label')].find(l => l.textContent.trim() === name)
            if (!label) return null
            const el = document.querySelector(`[role="slider"][aria-labelledby~="${label.id}"], input[type="range"][aria-labelledby~="${label.id}"]`)
            return el ? el.getAttribute('aria-valuenow') || el.value : null
        }
        window.__ready = true
    </script>
</body>
</html>
