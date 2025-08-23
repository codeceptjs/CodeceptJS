<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeceptJS Test Application</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle {
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 30px;
            font-size: 1.2em;
        }
        .notice {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #34495e;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .form-link {
            display: block;
            padding: 15px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s ease;
            text-align: center;
            font-weight: 500;
        }
        .form-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .basic { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .examples { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .interactive { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .waiting { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        .bugs { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .utility { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
        .info-section {
            background: #e8f4fd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #7f8c8d;
        }
        .debug {
            margin-top: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 data-testid="welcome">CodeceptJS Test Application</h1>
        <p class="subtitle">A comprehensive testing sandbox for learning and practicing web automation</p>
        
        <div class="notice" qa-id="test">
            <?php if (isset($notice)) echo $notice; ?>
        </div>

        <div class="info-section">
            <h3>Welcome to the CodeceptJS Test App!</h3>
            <p>This application provides a variety of test forms and interactive elements to help you learn and practice CodeceptJS automation. Similar to <a href="https://the-internet.herokuapp.com" target="_blank">the-internet.herokuapp.com</a>, this sandbox offers different scenarios to test your automation skills.</p>
        </div>

        <!-- Basic Form Elements -->
        <div class="section">
            <h2>Basic Form Elements</h2>
            <div class="form-grid">
                <a href="/form/button" class="form-link basic">Button Forms</a>
                <a href="/form/checkbox" class="form-link basic">Checkbox</a>
                <a href="/form/checkbox_array" class="form-link basic">Checkbox Arrays</a>
                <a href="/form/radio" class="form-link basic">Radio Buttons</a>
                <a href="/form/select" class="form-link basic">Select Dropdown</a>
                <a href="/form/select_multiple" class="form-link basic">Multiple Select</a>
                <a href="/form/textarea" class="form-link basic">Text Area</a>
                <a href="/form/field" class="form-link basic">Text Fields</a>
                <a href="/form/hidden" class="form-link basic">Hidden Fields</a>
                <a href="/form/file" class="form-link basic">File Upload</a>
            </div>
        </div>

        <!-- Example Forms -->
        <div class="section">
            <h2>Example Forms & Scenarios</h2>
            <div class="form-grid">
                <a href="/form/example1" class="form-link examples">Login Form</a>
                <a href="/form/example2" class="form-link examples">Registration</a>
                <a href="/form/example3" class="form-link examples">Contact Form</a>
                <a href="/form/example4" class="form-link examples">Bootstrap Layout</a>
                <a href="/form/example5" class="form-link examples">Complex Form</a>
                <a href="/form/example6" class="form-link examples">Multi-step Form</a>
                <a href="/form/example7" class="form-link examples">Validation Demo</a>
                <a href="/form/example8" class="form-link examples">Dynamic Fields</a>
                <a href="/form/example9" class="form-link examples">Table Form</a>
                <a href="/form/example10" class="form-link examples">Grid Layout</a>
                <a href="/form/example11" class="form-link examples">Relative Paths</a>
                <a href="/form/example12" class="form-link examples">Advanced Form</a>
                <a href="/form/example13" class="form-link examples">Modal Form</a>
                <a href="/form/example14" class="form-link examples">Wizard Form</a>
                <a href="/form/example15" class="form-link examples">Product Form</a>
                <a href="/form/example16" class="form-link examples">Survey Form</a>
                <a href="/form/example17" class="form-link examples">Settings Form</a>
                <a href="/form/example20" class="form-link examples">Special Example</a>
            </div>
        </div>

        <!-- Interactive Elements -->
        <div class="section">
            <h2>Interactive Elements & Actions</h2>
            <div class="form-grid">
                <a href="/form/hover" class="form-link interactive">Hover Effects</a>
                <a href="/form/doubleclick" class="form-link interactive">Double Click</a>
                <a href="/form/rightclick" class="form-link interactive">Right Click</a>
                <a href="/form/popup" class="form-link interactive">Popup/Modal</a>
                <a href="/form/resize" class="form-link interactive">Resize Elements</a>
                <a href="/form/scroll" class="form-link interactive">Scroll Actions</a>
                <a href="/form/scroll_into_view" class="form-link interactive">Scroll Into View</a>
                <a href="/form/focus_blur_elements" class="form-link interactive">Focus & Blur</a>
                <a href="/form/page_slider" class="form-link interactive">Page Slider</a>
                <a href="/form/contenteditable" class="form-link interactive">Content Editable</a>
                <a href="/form/image" class="form-link interactive">Image Interaction</a>
                <a href="/form/download" class="form-link interactive">Download File</a>
            </div>
        </div>

        <!-- Wait Conditions -->
        <div class="section">
            <h2>Wait Conditions & Timing</h2>
            <div class="form-grid">
                <a href="/form/wait_clickable" class="form-link waiting">Wait Clickable</a>
                <a href="/form/wait_visible" class="form-link waiting">Wait Visible</a>
                <a href="/form/wait_invisible" class="form-link waiting">Wait Invisible</a>
                <a href="/form/wait_enabled" class="form-link waiting">Wait Enabled</a>
                <a href="/form/wait_disabled" class="form-link waiting">Wait Disabled</a>
                <a href="/form/wait_element" class="form-link waiting">Wait Element</a>
                <a href="/form/wait_detached" class="form-link waiting">Wait Detached</a>
                <a href="/form/wait_value" class="form-link waiting">Wait Value</a>
                <a href="/form/wait_js" class="form-link waiting">Wait JavaScript</a>
                <a href="/form/wait_for_clickable" class="form-link waiting">Wait For Clickable</a>
                <a href="/form/wait_num_elements" class="form-link waiting">Wait Number Elements</a>
            </div>
        </div>

        <!-- Bug Test Cases -->
        <div class="section">
            <h2>Bug Test Cases & Edge Cases</h2>
            <div class="form-grid">
                <a href="/form/bug1467" class="form-link bugs">Bug #1467</a>
                <a href="/form/bug1535" class="form-link bugs">Bug #1535</a>
                <a href="/form/bug1585" class="form-link bugs">Bug #1585</a>
                <a href="/form/bug1598" class="form-link bugs">Bug #1598</a>
                <a href="/form/bug1637" class="form-link bugs">Bug #1637</a>
                <a href="/form/empty" class="form-link bugs">Empty Form</a>
                <a href="/form/empty_fill" class="form-link bugs">Empty Fill</a>
                <a href="/form/unchecked" class="form-link bugs">Unchecked State</a>
            </div>
        </div>

        <!-- Advanced & Utility -->
        <div class="section">
            <h2>Advanced Features & Utilities</h2>
            <div class="form-grid">
                <a href="/form/complex" class="form-link utility">Complex Form</a>
                <a href="/form/form_with_buttons" class="form-link utility">Multiple Buttons</a>
                <a href="/form/submit_adjacentforms" class="form-link utility">Adjacent Forms</a>
                <a href="/form/submitform_multiple" class="form-link utility">Multiple Submits</a>
                <a href="/form/submitform_ampersands" class="form-link utility">Special Characters</a>
                <a href="/form/names-sq-brackets" class="form-link utility">Square Brackets</a>
                <a href="/form/field_values" class="form-link utility">Field Values</a>
                <a href="/form/select_onchange" class="form-link utility">Select onChange</a>
                <a href="/form/select_two_submits" class="form-link utility">Select Two Submits</a>
                <a href="/form/select_additional_spaces" class="form-link utility">Select Spaces</a>
                <a href="/form/css_colors" class="form-link utility">CSS Colors</a>
                <a href="/form/custom_locator" class="form-link utility">Custom Locators</a>
                <a href="/form/aria" class="form-link utility">ARIA Attributes</a>
                <a href="/form/fetch_call" class="form-link utility">Fetch API</a>
                <a href="/form/relative_siteroot" class="form-link utility">Relative Paths</a>
            </div>
        </div>

        <!-- General Pages -->
        <div class="section">
            <h2>General Test Pages</h2>
            <div class="form-grid">
                <a href="/info" class="form-link utility" id="link" qa-id="test" qa-link="test">Information Page</a>
                <a href="/login" class="form-link utility">Login Page</a>
                <a href="/cookies" class="form-link utility">Cookies Test</a>
                <a href="/search" class="form-link utility">Search Page</a>
                <a href="/spinner" class="form-link utility">Loading Spinner</a>
                <a href="/iframe" class="form-link utility">iFrame Test</a>
                <a href="/external_url" class="form-link utility">External URL</a>
                <a href="/image" class="form-link utility">Basic Image</a>
                <a href="/invisible_elements" class="form-link utility">Invisible Elements</a>
            </div>
        </div>

        <div class="footer">
            <p>CodeceptJS Test Application - A comprehensive testing sandbox</p>
            <p>Inspired by <a href="https://the-internet.herokuapp.com" target="_blank">the-internet.herokuapp.com</a></p>
        </div>

        <div class="debug">
            <strong>Debug Info:</strong>
            <?php if (!empty($_POST)): ?>
                <pre><?php print_r($_POST); ?></pre>
            <?php else: ?>
                <em>No POST data</em>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
