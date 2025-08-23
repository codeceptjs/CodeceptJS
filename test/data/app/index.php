<?php
// Main router for React SPA with PHP fallbacks
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$spa_path = __DIR__ . '/../spa/dist';

// Handle static assets (JS, CSS, images, etc.)
if (preg_match('/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/', $request_uri)) {
    $file_path = $spa_path . $request_uri;
    if (file_exists($file_path)) {
        $ext = pathinfo($file_path, PATHINFO_EXTENSION);
        $content_types = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon'
        ];
        
        if (isset($content_types[$ext])) {
            header('Content-Type: ' . $content_types[$ext]);
        }
        readfile($file_path);
        exit;
    } else {
        // Asset not found
        http_response_code(404);
        echo "Asset not found: " . $request_uri;
        exit;
    }
}

// Handle API routes
if (strpos($request_uri, '/api/') === 0) {
    $api_file = __DIR__ . $request_uri;
    if (file_exists($api_file)) {
        include $api_file;
        exit;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found']);
        exit;
    }
}

// Handle POST data for React app
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST)) {
    // Store POST data in session for React app to display
    session_start();
    $_SESSION['post_data'] = $_POST;
    
    // Redirect back to index with a flag
    header('Location: /?posted=1');
    exit;
}

// Handle special PHP routes that still need server-side processing
if (!headers_sent()) header('Content-Type: text/html; charset=UTF-8');

// Routes that need special PHP processing
$special_routes = [
    '/cookies', '/cookies2', '/login', '/auth', '/register', 
    '/content-iso', '/content-cp1251', '/unset-cookie',
    '/download', '/basic_auth', '/redirect', '/redirect2', 
    '/redirect3', '/redirect_long', '/redirect4', 
    '/redirect_params', '/redirect_interval', 
    '/redirect_header_interval', '/redirect_self',
    '/relative_redirect', '/relative/redirect', '/redirect_twice',
    '/somepath/redirect_base_uri_has_path',
    '/somepath/redirect_base_uri_has_path_302',
    '/facebook', '/articles', '/external_url',
    '/iframe', '/iframes', '/iframe_nested', '/dynamic', 
    '/timeout', '/image', '/invisible_elements'
];

foreach ($special_routes as $route) {
    if (strpos($request_uri, $route) === 0) {
        // Load the original PHP routing for these special cases
        require_once('glue.php');
        require_once('data.php');
        require_once('controllers.php');

        $urls = array(
            '/' => 'index',
            '/info' => 'info',
            '/cookies' => 'cookies',
            '/cookies2' => 'cookiesHeader',
            '/search.*' => 'search',
            '/login' => 'login',
            '/redirect' => 'redirect',
            '/redirect2' => 'redirect2',
            '/redirect3' => 'redirect3',
            '/redirect_long' => 'redirect_long',
            '/redirect4' => 'redirect4',
            '/redirect_params' => 'redirect_params',
            '/redirect_interval' => 'redirect_interval',
            '/redirect_header_interval' => 'redirect_header_interval',
            '/redirect_self' => 'redirect_self',
            '/relative_redirect' => 'redirect_relative',
            '/relative/redirect' => 'redirect_relative',
            '/redirect_twice' => 'redirect_twice',
            '/relative/info' => 'info',
            '/somepath/redirect_base_uri_has_path' => 'redirect_base_uri_has_path',
            '/somepath/redirect_base_uri_has_path_302' => 'redirect_base_uri_has_path_302',
            '/somepath/info' => 'info',
            '/facebook\??.*' => 'facebookController',
            '/form/(.*?)(#|\?.*?)?' => 'form',
            '/articles\??.*' => 'articles',
            '/auth' => 'httpAuth',
            '/register' => 'register',
            '/content-iso' => 'contentType1',
            '/content-cp1251' => 'contentType2',
            '/unset-cookie' => 'unsetCookie',
            '/external_url' => 'external_url',
            '/spinner' => 'spinner',
            '/iframe' => 'iframe',
            '/iframes' => 'iframes',
            '/iframe_nested' => 'iframe_nested',
            '/dynamic' => 'dynamic',
            '/timeout' => 'timeout',
            '/download' => 'download',
            '/basic_auth' => 'basic_auth',
            '/image' => 'basic_image',
            '/invisible_elements' => 'invisible_elements'
        );

        glue::stick($urls);
        exit;
    }
}

// For all other routes (React SPA routes), serve the index.html
$index_file = $spa_path . '/index.html';
if (file_exists($index_file)) {
    readfile($index_file);
} else {
    echo "React SPA not built. Please run 'npm run build' in test/data/spa directory.";
}
