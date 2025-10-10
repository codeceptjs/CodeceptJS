<!doctype html>
<html>
<head>
    <title>Role Elements Test</title>
    <style>
        .container { max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
        button { padding: 10px 20px; margin-right: 10px; }
        .result { margin-top: 20px; padding: 15px; background: #f0f0f0; display: none; }
        .custom-combobox {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            min-height: 20px;
            box-sizing: border-box;
            background: white;
        }
        .custom-combobox:focus {
            outline: 2px solid #007bff;
        }
        .custom-combobox:empty:before {
            content: attr(data-placeholder);
            color: #999;
        }
        .custom-checkbox {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid #333;
            border-radius: 3px;
            cursor: pointer;
            position: relative;
            vertical-align: middle;
            margin-right: 8px;
        }
        .custom-checkbox[aria-checked="true"]:after {
            content: '✓';
            position: absolute;
            top: -2px;
            left: 2px;
            font-size: 16px;
            color: #007bff;
        }
        .custom-button {
            padding: 10px 20px;
            margin-right: 10px;
            border: 1px solid #007bff;
            background: #007bff;
            color: white;
            border-radius: 4px;
            cursor: pointer;
        }
        .custom-button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Role Elements Test Form</h1>

        <form id="testForm" action="/form/complex" method="POST">
            <div class="form-group">
                <label for="title">Title</label>
                <div id="title"
                     class="custom-combobox"
                     role="combobox"
                     contenteditable="true"
                     data-placeholder="Title"
                     placeholder="Title"
                     aria-label="Title"></div>
            </div>

            <div class="form-group">
                <label for="name">Name</label>
                <div id="name"
                     class="custom-combobox"
                     role="combobox"
                     contenteditable="true"
                     data-placeholder="Name"
                     placeholder="Name"
                     aria-label="Name"></div>
            </div>

            <div class="form-group">
                <label for="category">Category</label>
                <div id="category"
                     class="custom-combobox"
                     role="combobox"
                     contenteditable="true"
                     data-placeholder="Category"
                     placeholder="Category"
                     aria-label="Category"></div>
            </div>

            <div class="form-group">
                <label for="job">Job Title</label>
                <div id="job"
                     class="custom-combobox"
                     role="combobox"
                     contenteditable="true"
                     data-placeholder="Title"
                     placeholder="Title"
                     aria-label="Title"></div>
            </div>

            <div class="form-group">
                <label for="email">Email</label>
                <div id="email"
                     class="custom-combobox"
                     role="textbox"
                     contenteditable="true"
                     data-placeholder="your@email.com"
                     placeholder="your@email.com"
                     aria-label="your@email.com"></div>
            </div>

            <div class="form-group">
                <label for="message">Message</label>
                <div id="message"
                     class="custom-combobox"
                     role="textbox"
                     contenteditable="true"
                     data-placeholder="Enter your message"
                     placeholder="Enter your message"
                     aria-label="Enter your message"></div>
            </div>

            <div class="form-group">
                <label for="search">Search</label>
                <input type="search" id="search" name="search" role="searchbox">
            </div>

            <div class="form-group">
                <label>
                    <span class="custom-checkbox"
                          role="checkbox"
                          aria-checked="false"
                          tabindex="0"
                          aria-label="I agree to the terms and conditions"></span>
                    I agree to the terms and conditions
                </label>
            </div>

            <div class="form-group">
                <label>
                    <span class="custom-checkbox"
                          role="checkbox"
                          aria-checked="false"
                          tabindex="0"
                          aria-label="Subscribe to newsletter"></span>
                    Subscribe to newsletter
                </label>
            </div>

            <div class="form-group">
                <div class="custom-button" role="button" tabindex="0" id="submitBtn">Submit Form</div>
                <div class="custom-button" role="button" tabindex="0" onclick="window.location.href='/'">Cancel</div>
                <div class="custom-button" role="button" tabindex="0" id="resetBtn">Reset</div>
            </div>
        </form>

        <div id="result" class="result">
            <h2>Form Submitted!</h2>
            <p>Form data submitted</p>
            <div id="formData"></div>
        </div>
    </div>

    <script>
        document.querySelectorAll('.custom-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', function() {
                const isChecked = this.getAttribute('aria-checked') === 'true';
                this.setAttribute('aria-checked', !isChecked);
            });

            checkbox.addEventListener('keydown', function(e) {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        document.getElementById('submitBtn').addEventListener('click', function() {
            const data = {
                title: document.getElementById('title').textContent || '',
                name: document.getElementById('name').textContent || '',
                category: document.getElementById('category').textContent || '',
                job: document.getElementById('job').textContent || '',
                email: document.getElementById('email').textContent || '',
                message: document.getElementById('message').textContent || '',
                search: document.getElementById('search').value || ''
            };

            const result = document.getElementById('result');
            const formDataDiv = document.getElementById('formData');

            let html = '<ul>';
            for (let key in data) {
                if (data[key]) {
                    html += '<li><strong>' + key + ':</strong> ' + data[key] + '</li>';
                }
            }
            html += '</ul>';

            formDataDiv.innerHTML = html;
            result.style.display = 'block';
        });

        document.getElementById('resetBtn').addEventListener('click', function() {
            document.querySelectorAll('[contenteditable]').forEach(el => {
                el.textContent = '';
            });
            document.getElementById('search').value = '';
            document.querySelectorAll('.custom-checkbox').forEach(cb => {
                cb.setAttribute('aria-checked', 'false');
            });
            document.getElementById('result').style.display = 'none';
        });
    </script>
</body>
</html>
