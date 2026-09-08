<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Radix Slider</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .SliderRoot { position: relative; display: flex; align-items: center; user-select: none; touch-action: none; }
        .SliderRoot[data-orientation="horizontal"] { width: 200px; height: 20px; }
        .SliderRoot[data-orientation="vertical"] { flex-direction: column; width: 20px; height: 150px; }
        .SliderTrack { position: relative; background: #ccc; flex-grow: 1; border-radius: 9999px; }
        .SliderTrack[data-orientation="horizontal"] { height: 4px; }
        .SliderTrack[data-orientation="vertical"] { width: 4px; }
        .SliderRange { position: absolute; background: #333; border-radius: 9999px; }
        .SliderRange[data-orientation="horizontal"] { height: 100%; }
        .SliderRange[data-orientation="vertical"] { width: 100%; }
        .SliderThumb { display: block; width: 16px; height: 16px; background: #fff; border: 2px solid #333; border-radius: 50%; }
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
    <h1>Radix Slider</h1>
    <div id="root"></div>
    <script type="module">
        import * as React from 'react'
        import { createRoot } from 'react-dom/client'
        import { Slider } from 'https://esm.sh/radix-ui@1.6.7?external=react,react-dom'

        const h = React.createElement

        function Row({ label, orientation, step, defaultValue }) {
            return h('div', { className: 'row' },
                h('span', null, label),
                h(Slider.Root, { className: 'SliderRoot', defaultValue: [defaultValue], max: 100, step, orientation },
                    h(Slider.Track, { className: 'SliderTrack' }, h(Slider.Range, { className: 'SliderRange' })),
                    h(Slider.Thumb, { className: 'SliderThumb', 'aria-label': label })))
        }

        function App() {
            return h(React.Fragment, null,
                h(Row, { label: 'Brightness', orientation: 'horizontal', step: 1, defaultValue: 50 }),
                h(Row, { label: 'Radix quality', orientation: 'horizontal', step: 5, defaultValue: 0 }),
                h(Row, { label: 'Contrast', orientation: 'vertical', step: 1, defaultValue: 50 }))
        }

        createRoot(document.getElementById('root')).render(h(App))

        window.__sliderValue = name => {
            const el = document.querySelector(`[role="slider"][aria-label="${name}"]`)
            return el && el.getAttribute('aria-valuenow')
        }
        window.__ready = true
    </script>
</body>
</html>
