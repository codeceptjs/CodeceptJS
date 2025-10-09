<!DOCTYPE html>
<html>
<head>
    <title>Role Elements Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, button, select { padding: 8px; margin: 5px 0; }
        .result { margin-top: 20px; padding: 10px; background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>Role Elements Test Page</h1>

    <form action="/form/role_elements" method="POST">
        <div class="form-group">
            <label for="title-input">Title Search:</label>
            <input id="title-input" name="title" role="combobox" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Title" type="search">
        </div>

        <div class="form-group">
            <label for="name-input">Name Search:</label>
            <input id="name-input" name="name" role="combobox" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Name" type="search">
        </div>

        <div class="form-group">
            <label for="category-input">Category Search:</label>
            <input id="category-input" name="category" role="combobox" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Category" type="search">
        </div>

        <div class="form-group">
            <label for="search-input">General Search:</label>
            <input id="search-input" name="search" role="searchbox" placeholder="Search..." type="search">
        </div>

        <div class="form-group">
            <label for="email-input">Email:</label>
            <input id="email-input" name="email" role="textbox" type="email" placeholder="your@email.com">
        </div>

        <div class="form-group">
            <label for="message-text">Message:</label>
            <textarea id="message-text" name="message" role="textbox" placeholder="Enter your message"></textarea>
        </div>

        <div class="form-group">
            <button name="submit" role="button" type="submit">Submit Form</button>
            <button name="cancel" role="button" type="button">Cancel</button>
            <button name="reset" role="button" type="reset">Reset</button>
        </div>

        <div class="form-group">
            <label for="country-select">Country:</label>
            <select id="country-select" name="country" role="combobox">
                <option value="">Select a country</option>
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
            </select>
        </div>

        <div class="form-group">
            <input name="newsletter" role="checkbox" type="checkbox" id="newsletter-checkbox">
            <label for="newsletter-checkbox">Subscribe to newsletter</label>
        </div>

        <div class="form-group">
            <input name="terms" role="checkbox" type="checkbox" id="terms-checkbox">
            <label for="terms-checkbox">I agree to the terms and conditions</label>
        </div>
    </form>

    <div class="result" id="result" style="display: none;">
        <h3>Form Submitted!</h3>
        <p id="result-text"></p>
    </div>

    <script>
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            const resultDiv = document.getElementById('result');
            const resultText = document.getElementById('result-text');

            const formData = new FormData(this);
            let result = 'Form data submitted:<br>';
            for (let [key, value] of formData.entries()) {
                if (value) result += `${key}: ${value}<br>`;
            }

            resultText.innerHTML = result;
            resultDiv.style.display = 'block';
        });

        document.querySelector('button[name="cancel"]').addEventListener('click', function() {
            document.querySelector('form').reset();
            document.getElementById('result').style.display = 'none';
        });

        document.querySelector('button[name="reset"]').addEventListener('click', function() {
            document.getElementById('result').style.display = 'none';
        });
    </script>
</body>
</html>