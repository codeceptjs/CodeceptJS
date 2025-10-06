/**
 * customLocator.js
 * Converted from HTML + JS to a pure Node.js file.
 * Serves an interactive multi-step button visibility page.
 */

const http = require('http')

const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Step Buttons</title>
    <style>
      .invisible_button { display: none; }
      div[data-test-id] {
        margin: 10px;
        padding: 10px;
        background-color: #eef;
        width: fit-content;
        border-radius: 6px;
        cursor: pointer;
      }
    </style>
  </head>

  <body>
    <div data-test-id="step_1" class="invisible_button">Step One Button</div>
    <div data-test-id="step_2" class="invisible_button">Step Two Button</div>
    <div data-test-id="step_3" class="invisible_button">Step Three Button</div>
    <div data-test-id="step_4" class="invisible_button">Steps Complete!</div>

    <script>
      function _prepareStepButtons() {
        ['step_1', 'step_2', 'step_3'].forEach(function(id, index) {
          var num = index + 2,
              nextIDNum = num.toString();

          getByAttribute(id).addEventListener('click', function(event) {
            var nextID = 'step_' + nextIDNum;
            removeClass(getByAttribute(nextID), 'invisible_button');
          });
        });
      }

      function getByAttribute(id) {
        return document.querySelector('[data-test-id="' + id + '"]');
      }

      function removeClass(el, cls) {
        el.classList.remove(cls);
        return el;
      }

      _prepareStepButtons();

      // Reveal step_1 after 1 second
      setTimeout(function () {
        removeClass(getByAttribute('step_1'), 'invisible_button');
      }, 1000);
    </script>
  </body>
</html>`

// Start local web server
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })
  .listen(8100, () => {
    console.log('✅ Step Buttons page running at http://127.0.0.1:8100')
  })
