<!DOCTYPE html>
<html>
<head>
  <title>Custom Select (Combobox/Listbox)</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .form-group { margin: 20px 0; }
    .form-group > label { display: block; margin-bottom: 5px; font-weight: bold; }

    .combobox-wrapper { position: relative; width: 250px; }
    .combobox-trigger {
      padding: 10px; border: 1px solid #ccc; border-radius: 4px;
      background: #fff; cursor: pointer; display: flex; justify-content: space-between;
    }
    .combobox-trigger::after { content: '▼'; font-size: 10px; }
    .combobox-trigger[aria-expanded="true"]::after { content: '▲'; }

    .listbox {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 100;
      border: 1px solid #ccc; border-radius: 4px; background: #fff;
      max-height: 200px; overflow-y: auto; display: none;
    }
    .listbox.open { display: block; }
    .listbox [role="option"] {
      padding: 10px; cursor: pointer;
    }
    .listbox [role="option"]:hover { background: #e8e8e8; }
    .listbox [role="option"][aria-selected="true"] { background: #d0e0ff; }

    .standalone-listbox {
      width: 250px; border: 1px solid #ccc; border-radius: 4px;
      max-height: 150px; overflow-y: auto;
    }
    .standalone-listbox [role="option"] { padding: 8px 12px; cursor: pointer; }
    .standalone-listbox [role="option"]:hover { background: #e8e8e8; }
    .standalone-listbox [role="option"][aria-selected="true"] { background: #d0e0ff; }

    #result { margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Custom Select Components</h1>

  <div class="form-group">
    <label id="country-label">Country</label>
    <div class="combobox-wrapper">
      <div role="combobox" aria-labelledby="country-label" aria-expanded="false" aria-haspopup="listbox" tabindex="0" class="combobox-trigger" id="country-trigger">
        <span class="combobox-value">Select country...</span>
      </div>
      <div role="listbox" aria-labelledby="country-label" class="listbox" id="country-listbox">
        <div role="option" data-value="uk">London</div>
        <div role="option" data-value="pt">Porto</div>
        <div role="option" data-value="us">New York</div>
        <div role="option" data-value="fr">Paris</div>
      </div>
    </div>
    <input type="hidden" name="country" id="country-input">
  </div>

  <div class="form-group">
    <label id="city-label">City</label>
    <div class="combobox-wrapper">
      <div role="combobox" aria-labelledby="city-label" aria-expanded="false" aria-haspopup="listbox" tabindex="0" class="combobox-trigger" id="city-trigger">
        <span class="combobox-value">Select city...</span>
      </div>
      <div role="listbox" aria-labelledby="city-label" class="listbox" id="city-listbox">
        <div role="option" data-value="berlin">Berlin</div>
        <div role="option" data-value="madrid">Madrid</div>
        <div role="option" data-value="rome">Rome</div>
      </div>
    </div>
    <input type="hidden" name="city" id="city-input">
  </div>

  <div class="form-group">
    <label id="color-label">Favorite Color</label>
    <div role="listbox" aria-labelledby="color-label" class="standalone-listbox" id="color-listbox" tabindex="0">
      <div role="option" data-value="red">Red</div>
      <div role="option" data-value="green">Green</div>
      <div role="option" data-value="blue">Blue</div>
      <div role="option" data-value="yellow">Yellow</div>
    </div>
    <input type="hidden" name="color" id="color-input">
  </div>

  <div class="form-group">
    <label id="tags-label">Tags</label>
    <div role="listbox" aria-labelledby="tags-label" aria-multiselectable="true" class="standalone-listbox" id="tags-listbox" tabindex="0">
      <div role="option" data-value="important">Important</div>
      <div role="option" data-value="urgent">Urgent</div>
      <div role="option" data-value="review">Review</div>
      <div role="option" data-value="later">Later</div>
    </div>
    <input type="hidden" name="tags" id="tags-input">
  </div>

  <div id="result">Selected: <span id="selected-values">none</span></div>

  <script>
    function initCombobox(triggerId, listboxId, inputId) {
      const trigger = document.getElementById(triggerId);
      const listbox = document.getElementById(listboxId);
      const input = document.getElementById(inputId);
      const valueSpan = trigger.querySelector('.combobox-value');

      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', !expanded);
        listbox.classList.toggle('open', !expanded);
      });

      listbox.querySelectorAll('[role="option"]').forEach(opt => {
        opt.addEventListener('click', () => {
          listbox.querySelectorAll('[role="option"]').forEach(o => o.removeAttribute('aria-selected'));
          opt.setAttribute('aria-selected', 'true');
          valueSpan.textContent = opt.textContent;
          input.value = opt.dataset.value;
          trigger.setAttribute('aria-expanded', 'false');
          listbox.classList.remove('open');
          updateResult();
        });
      });

      document.addEventListener('click', e => {
        if (!trigger.contains(e.target) && !listbox.contains(e.target)) {
          trigger.setAttribute('aria-expanded', 'false');
          listbox.classList.remove('open');
        }
      });
    }

    function initListbox(listboxId, inputId) {
      const listbox = document.getElementById(listboxId);
      const input = document.getElementById(inputId);
      const isMultiSelect = listbox.getAttribute('aria-multiselectable') === 'true';

      listbox.querySelectorAll('[role="option"]').forEach(opt => {
        opt.addEventListener('click', () => {
          if (isMultiSelect) {
            const selected = opt.getAttribute('aria-selected') === 'true';
            opt.setAttribute('aria-selected', !selected);
            const values = [];
            listbox.querySelectorAll('[role="option"][aria-selected="true"]').forEach(o => values.push(o.dataset.value));
            input.value = values.join(',');
          } else {
            listbox.querySelectorAll('[role="option"]').forEach(o => o.removeAttribute('aria-selected'));
            opt.setAttribute('aria-selected', 'true');
            input.value = opt.dataset.value;
          }
          updateResult();
        });
      });
    }

    function updateResult() {
      const values = [];
      ['country', 'city', 'color', 'tags'].forEach(name => {
        const val = document.getElementById(name + '-input').value;
        if (val) values.push(name + ': ' + val);
      });
      document.getElementById('selected-values').textContent = values.length ? values.join(', ') : 'none';
    }

    initCombobox('country-trigger', 'country-listbox', 'country-input');
    initCombobox('city-trigger', 'city-listbox', 'city-input');
    initListbox('color-listbox', 'color-input');
    initListbox('tags-listbox', 'tags-input');
  </script>
</body>
</html>
