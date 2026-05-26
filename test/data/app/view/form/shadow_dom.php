<!DOCTYPE html>
<html>
<head>
  <title>Shadow DOM Test</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .result { margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Shadow DOM Test Page</h1>

  <p>This page contains Web Components with Shadow DOM for testing.</p>

  <!-- Simple shadow DOM component -->
  <my-button id="simple-component"></my-button>

  <!-- Nested shadow DOM components -->
  <my-app id="nested-component"></my-app>

  <div class="result">
    <p>Clicked: <span id="clicked-element">none</span></p>
    <p>Input value: <span id="input-value">empty</span></p>
  </div>

  <script>
    // Simple button component
    class MyButton extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
          <style>
            button {
              padding: 10px 20px;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            button:hover { background: #0056b3; }
          </style>
          <button class="shadow-button">Click Me (Shadow)</button>
        `;

        shadow.querySelector('button').addEventListener('click', () => {
          document.getElementById('clicked-element').textContent = 'my-button > button';
        });
      }
    }
    customElements.define('my-button', MyButton);

    // Container component
    class MyApp extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
          <style>
            .app-container {
              padding: 20px;
              border: 2px solid #333;
              border-radius: 8px;
              margin: 10px 0;
            }
            h2 { margin-top: 0; }
          </style>
          <div class="app-container">
            <h2>My App (Shadow Root)</h2>
            <my-form></my-form>
          </div>
        `;
      }
    }
    customElements.define('my-app', MyApp);

    // Form component (nested inside my-app)
    class MyForm extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
          <style>
            .form-group { margin: 10px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input {
              padding: 8px;
              border: 1px solid #ccc;
              border-radius: 4px;
              width: 200px;
            }
            button {
              padding: 8px 16px;
              background: #28a745;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 10px;
            }
          </style>
          <div class="form-group">
            <label for="shadow-input">Name</label>
            <input type="text" id="shadow-input" class="shadow-input" placeholder="Enter name">
          </div>
          <button class="submit-btn">Submit</button>
        `;

        const input = shadow.querySelector('input');
        const submitBtn = shadow.querySelector('button');

        input.addEventListener('input', () => {
          document.getElementById('input-value').textContent = input.value || 'empty';
        });

        submitBtn.addEventListener('click', () => {
          document.getElementById('clicked-element').textContent = 'my-app > my-form > button';
        });
      }
    }
    customElements.define('my-form', MyForm);
  </script>
</body>
</html>
